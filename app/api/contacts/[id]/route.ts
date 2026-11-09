import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { contactSchema } from "@/lib/validations";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const first = Object.values(fields).flat()[0];
      return NextResponse.json({ error: first ?? "Invalid contact" }, { status: 400 });
    }

    const email = parsed.data.email.trim();
    const duplicate = await prisma.contact.findFirst({
      where: { id: { not: id }, email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "A contact with this email already exists" }, { status: 409 });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        fullName: parsed.data.fullName.trim(),
        email,
        designation: parsed.data.designation.trim(),
        company: parsed.data.company.trim(),
        mobile: parsed.data.mobile?.trim() || null,
        salutation: parsed.data.salutation ?? null,
        category: parsed.data.category,
      },
    });
    return NextResponse.json(contact);
  } catch {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
