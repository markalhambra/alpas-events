import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_VIBER_MESSAGE_TEMPLATE } from "@/lib/viber";

interface Params {
  params: Promise<{ id: string }>;
}

const MAX_TEMPLATE_LENGTH = 2000;

export async function GET(_: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { viberMessageTemplate: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  return NextResponse.json({
    template: event.viberMessageTemplate,
    defaultTemplate: DEFAULT_VIBER_MESSAGE_TEMPLATE,
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const template = typeof body?.template === "string" ? body.template : null;
  if (template === null) {
    return NextResponse.json({ error: "Template is required" }, { status: 400 });
  }
  if (template.length > MAX_TEMPLATE_LENGTH) {
    return NextResponse.json({ error: "Viber message must be 2,000 characters or less" }, { status: 400 });
  }

  const saved = template.trim() ? template : null;
  const updated = await prisma.event.update({
    where: { id },
    data: { viberMessageTemplate: saved },
    select: { viberMessageTemplate: true },
  });

  return NextResponse.json({
    template: updated.viberMessageTemplate,
    defaultTemplate: DEFAULT_VIBER_MESSAGE_TEMPLATE,
  });
}
