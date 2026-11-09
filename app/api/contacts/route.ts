import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { contactSchema } from "@/lib/validations";

function cleanContact(data: {
  fullName: string;
  email: string;
  designation: string;
  company: string;
  mobile?: string;
  salutation?: "MR" | "MS" | "MRS" | "DR" | "ENGR" | "ATTY" | "PROF";
  category: "VIP" | "MEDIA" | "SPONSOR" | "SPEAKER" | "GENERAL";
}) {
  return {
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    designation: data.designation.trim(),
    company: data.company.trim(),
    mobile: data.mobile?.trim() || null,
    salutation: data.salutation ?? null,
    category: data.category,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  try {
    const contacts = await prisma.contact.findMany({
      where: q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { fullName: "asc" },
      take: 50,
    });
    return NextResponse.json(contacts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const first = Object.values(fields).flat()[0];
      return NextResponse.json({ error: first ?? "Invalid contact" }, { status: 400 });
    }

    const data = cleanContact(parsed.data);
    const duplicate = await prisma.contact.findFirst({
      where: { email: { equals: data.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: "A contact with this email already exists" }, { status: 409 });
    }

    const contact = await prisma.contact.create({
      data: { ...data, createdById: auth.admin.id },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
