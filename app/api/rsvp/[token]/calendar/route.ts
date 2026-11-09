import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIcs } from "@/lib/calendar";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      guest: { select: { rsvpStatus: true } },
      event: {
        select: { name: true, startTime: true, endTime: true, venue: true },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation link" }, { status: 404 });
  }
  if (invitation.guest.rsvpStatus !== "ACCEPTED") {
    return NextResponse.json({ error: "Accept the invitation before adding it to your calendar" }, { status: 403 });
  }

  const ics = buildIcs(
    {
      title: invitation.event.name,
      start: invitation.event.startTime,
      end: invitation.event.endTime,
      location: invitation.event.venue,
      description: `You're confirmed for ${invitation.event.name}.`,
    },
    `rsvp-${invitation.id}@alpas-events`
  );

  const filename = `${invitation.event.name.replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "") || "event"}.ics`;

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
