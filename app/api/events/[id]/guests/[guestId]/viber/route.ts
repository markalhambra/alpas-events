import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, formatDate, formatDateTime } from "@/lib/utils";
import {
  buildShortRsvpUrl,
  buildViberChatUrl,
  buildViberDraft,
  buildViberInvitationMessage,
  formatViberNumber,
  toViberNumber,
} from "@/lib/viber";
import type { InvitationMethod } from "@prisma/client";

interface Params {
  params: Promise<{ id: string; guestId: string }>;
}

export async function POST(_: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const admin = auth.admin;

  const { id: eventId, guestId } = await params;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (event.date < new Date()) {
      return NextResponse.json({ error: "Cannot send invitations for past events" }, { status: 400 });
    }

    const guest = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    const viberDigits = toViberNumber(guest.mobile);
    if (!viberDigits) {
      return NextResponse.json(
        { error: "Add a mobile number with country code before sending a Viber invite" },
        { status: 400 }
      );
    }

    const now = new Date();
    const existing = await prisma.invitation.findFirst({
      where: { guestId: guest.id, eventId },
      orderBy: { createdAt: "desc" },
    });
    const expired = !!existing?.tokenExpiresAt && existing.tokenExpiresAt < now;

    let token = existing && !expired ? existing.token : generateToken(48);
    let shortCode = existing && !expired ? existing.shortCode : null;

    if (!existing || expired) {
      const created = await createInvitation({
        eventId,
        guestId: guest.id,
        token,
        shortCode: generateToken(8),
        tokenExpiresAt: event.rsvpDeadline,
        sentAt: now,
      });
      token = created.token;
      shortCode = created.shortCode;
    } else {
      if (!shortCode) shortCode = generateToken(8);
      await prisma.invitation.update({
        where: { id: existing.id },
        data: {
          shortCode,
          sentAt: existing.sentAt ?? now,
          resendCount: existing.sentAt ? existing.resendCount + 1 : existing.resendCount,
          lastResentAt: existing.sentAt ? now : existing.lastResentAt,
          failedAt: null,
          failureReason: null,
        },
      });
    }

    const rsvpUrl = buildShortRsvpUrl(shortCode ?? token);
    const invite = {
      guestName: guest.fullName,
      salutation: guest.salutation,
      eventName: event.name,
      eventDate: formatDate(event.date),
      eventTime: formatDateTime(event.startTime),
      venue: event.venue,
      rsvpDeadline: formatDateTime(event.rsvpDeadline),
      rsvpUrl,
    };
    const message = buildViberInvitationMessage(invite);
    const draft = buildViberDraft(invite);
    const phone = formatViberNumber(viberDigits);

    await Promise.all([
      guest.rsvpStatus === "PENDING"
        ? prisma.guest.update({
            where: { id: guest.id },
            data: { rsvpStatus: "SENT" },
          })
        : Promise.resolve(),
      prisma.activityLog.create({
        data: {
          eventId,
          type: "INVITATION_SENT",
          description: `Viber invite opened for ${guest.fullName} (${phone})`,
          guestId: guest.id,
          adminId: admin.id,
          metadata: { channel: "viber", mobile: phone },
        },
      }),
    ]);

    return NextResponse.json({
      phone,
      message,
      draft,
      viberUrl: buildViberChatUrl(viberDigits, draft),
    });
  } catch {
    return NextResponse.json({ error: "Failed to prepare Viber invite" }, { status: 500 });
  }
}

async function createInvitation(data: {
  eventId: string;
  guestId: string;
  token: string;
  shortCode: string;
  tokenExpiresAt: Date;
  sentAt: Date;
}) {
  try {
    return await prisma.invitation.create({
      data: { ...data, method: "VIBER" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("VIBER")) throw err;
    return prisma.invitation.create({
      data: { ...data, method: "EMAIL" satisfies InvitationMethod },
    });
  }
}
