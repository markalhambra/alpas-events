import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rsvpResponseSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { formatDate, formatDateTime, interpolateTemplate } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { buildGoogleCalendarUrl, buildIcsUrl, calendarLinksHtml } from "@/lib/calendar";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { token } = await params;
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        guest: { select: { fullName: true, rsvpStatus: true, salutation: true } },
        event: { select: { name: true, date: true, startTime: true, venue: true, rsvpDeadline: true } },
      },
    });

    if (!invitation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invitation);
  } catch {
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;

  if (!checkRateLimit(`rsvp:${getClientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests, please try again shortly" }, { status: 429 });
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        guest: true,
        event: true,
      },
    });

    if (!invitation) return NextResponse.json({ error: "Invalid invitation link" }, { status: 404 });

    // Check expiry
    if (invitation.tokenExpiresAt && new Date(invitation.tokenExpiresAt) < new Date()) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
    }

    // Check RSVP deadline
    if (new Date(invitation.event.rsvpDeadline) < new Date()) {
      return NextResponse.json({ error: "RSVP deadline has passed" }, { status: 410 });
    }

    const body = await request.json();
    const parsed = rsvpResponseSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const first = Object.values(fields).flat()[0];
      return NextResponse.json({ error: first ?? "Invalid RSVP" }, { status: 400 });
    }

    const { response, declineReason, plusOneNames, dietaryPreference } = parsed.data;
    const now = new Date();
    const guestName =
      response === "ACCEPTED" ? parsed.data.fullName!.trim() : invitation.guest.fullName;
    const guestEmail =
      response === "ACCEPTED" ? parsed.data.email!.trim() : invitation.guest.email;
    const companyInput = parsed.data.company?.trim();
    const guestCompany =
      response === "ACCEPTED" && companyInput ? companyInput : invitation.guest.company;
    const mobileInput = parsed.data.mobile?.trim();
    const guestMobile =
      response === "ACCEPTED" ? mobileInput || null : invitation.guest.mobile;

    if (response === "ACCEPTED") {
      const duplicate = await prisma.guest.findFirst({
        where: {
          eventId: invitation.eventId,
          id: { not: invitation.guestId },
          email: { equals: guestEmail, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "That email is already used by another guest for this event" },
          { status: 409 }
        );
      }
    }

    await prisma.guest.update({
      where: { id: invitation.guestId },
      data: {
        rsvpStatus: response,
        rsvpRespondedAt: now,
        declineReason: declineReason ?? null,
        dietaryPreference: dietaryPreference ?? invitation.guest.dietaryPreference,
        ...(response === "ACCEPTED"
          ? {
              fullName: guestName,
              email: guestEmail,
              company: guestCompany,
              mobile: guestMobile,
              ...(plusOneNames !== undefined
                ? {
                    plusOnes: {
                      deleteMany: {},
                      create: plusOneNames.filter(Boolean).map((name) => ({ name })),
                    },
                  }
                : {}),
            }
          : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        eventId: invitation.eventId,
        type: response === "ACCEPTED" ? "RSVP_ACCEPTED" : "RSVP_DECLINED",
        description: `${guestName} ${response === "ACCEPTED" ? "accepted" : "declined"} the invitation`,
        guestId: invitation.guestId,
      },
    });

    // Send confirmation email
    const confirmTemplate = await prisma.emailTemplate.findFirst({
      where: {
        eventId: invitation.eventId,
        type: response === "ACCEPTED" ? "ACCEPTANCE_CONFIRMATION" : "DECLINE_ACKNOWLEDGMENT",
        isDefault: true,
      },
    });

    const eventName = invitation.event.name;
    const eventDate = formatDate(invitation.event.date);
    const eventTime = formatDateTime(invitation.event.startTime);
    const venue = invitation.event.venue;

    const calendarEvent = {
      title: eventName,
      start: invitation.event.startTime,
      end: invitation.event.endTime,
      location: venue,
      description: `You're confirmed for ${eventName}.`,
    };
    const googleCalendarUrl =
      response === "ACCEPTED" ? buildGoogleCalendarUrl(calendarEvent) : undefined;
    const icsUrl = response === "ACCEPTED" ? buildIcsUrl(token) : undefined;
    const calendarHtml =
      googleCalendarUrl && icsUrl ? calendarLinksHtml(googleCalendarUrl, icsUrl) : "";

    if (confirmTemplate && confirmTemplate.htmlBody) {
      const htmlBody =
        interpolateTemplate(confirmTemplate.htmlBody, {
          guestName,
          salutation: invitation.guest.salutation ?? "",
          eventName,
          eventDate,
          eventTime,
          venue,
          rsvpDeadline: formatDateTime(invitation.event.rsvpDeadline),
          acceptUrl: "",
          declineUrl: "",
          googleCalendarUrl: googleCalendarUrl ?? "",
          icsUrl: icsUrl ?? "",
        }) + calendarHtml;

      await sendEmail({
        to: guestEmail,
        subject: interpolateTemplate(confirmTemplate.subject ?? "", { eventName, guestName }),
        htmlBody,
      });
    } else if (response === "ACCEPTED") {
      await sendEmail({
        to: guestEmail,
        subject: `Attendance Confirmed — ${eventName}`,
        htmlBody: `<p>Dear ${invitation.guest.salutation ? invitation.guest.salutation + " " : ""}${guestName},</p>
          <p>Your attendance at <strong>${eventName}</strong> has been confirmed.</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          <p><strong>Venue:</strong> ${venue}</p>
          ${calendarHtml}
          <p>We look forward to seeing you!</p>`,
      });
    }

    return NextResponse.json({ success: true, response, googleCalendarUrl, icsUrl });
  } catch {
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}
