import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string; guestId: string }>;
}

export async function POST(_: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id: eventId, guestId } = await params;

  try {
    const guest = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    const existing = await prisma.contact.findFirst({
      where: { email: { equals: guest.email, mode: "insensitive" } },
    });

    const profile = {
      fullName: guest.fullName,
      email: guest.email.trim(),
      designation: guest.designation,
      company: guest.company,
      mobile: guest.mobile,
      salutation: guest.salutation,
      category: guest.category,
    };

    const contact = existing
      ? await prisma.contact.update({ where: { id: existing.id }, data: profile })
      : await prisma.contact.create({
          data: { ...profile, createdById: auth.admin.id },
        });

    return NextResponse.json({ action: existing ? "updated" : "created", contact });
  } catch {
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}
