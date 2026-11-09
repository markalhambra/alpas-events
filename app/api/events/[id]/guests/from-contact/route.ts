import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateToken } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const contactId = typeof body.contactId === "string" ? body.contactId : "";
    if (!contactId) return NextResponse.json({ error: "contactId is required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const existing = await prisma.guest.findFirst({
      where: {
        eventId,
        email: { equals: contact.email, mode: "insensitive" },
      },
    });

    if (existing) {
      const guest = await prisma.guest.update({
        where: { id: existing.id },
        data: {
          fullName: contact.fullName,
          company: contact.company,
          mobile: contact.mobile,
        },
      });
      await prisma.activityLog.create({
        data: {
          eventId,
          type: "GUEST_UPDATED",
          description: `Updated ${guest.fullName} from saved contacts`,
          guestId: guest.id,
          adminId: auth.admin.id,
        },
      });
      return NextResponse.json({ action: "updated", guest });
    }

    const guest = await prisma.guest.create({
      data: {
        eventId,
        fullName: contact.fullName,
        email: contact.email,
        designation: contact.designation,
        company: contact.company,
        mobile: contact.mobile,
        salutation: contact.salutation,
        category: contact.category,
        qrToken: generateToken(24),
      },
    });
    await prisma.activityLog.create({
      data: {
        eventId,
        type: "GUEST_CREATED",
        description: `Added ${guest.fullName} from saved contacts`,
        guestId: guest.id,
        adminId: auth.admin.id,
      },
    });
    return NextResponse.json({ action: "added", guest }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add contact to this event" }, { status: 500 });
  }
}
