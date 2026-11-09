import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { cloneEventSchema } from "@/lib/validations";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const source = await prisma.event.findUnique({
      where: { id },
      include: { emailTemplates: true },
    });
    if (!source) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await request.json();
    const parsed = cloneEventSchema.safeParse(body);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const first = Object.values(fields).flat()[0];
      return NextResponse.json({ error: first ?? "Invalid event details" }, { status: 400 });
    }

    const date = new Date(parsed.data.date);
    const startTime = new Date(parsed.data.startTime);
    const endTime = parsed.data.endTime ? new Date(parsed.data.endTime) : null;
    const rsvpDeadline = new Date(parsed.data.rsvpDeadline);
    if ([date, startTime, rsvpDeadline].some((value) => Number.isNaN(value.getTime()))) {
      return NextResponse.json({ error: "Enter a valid date and time" }, { status: 400 });
    }
    if (endTime && Number.isNaN(endTime.getTime())) {
      return NextResponse.json({ error: "Enter a valid end time" }, { status: 400 });
    }

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          name: parsed.data.name.trim(),
          date,
          startTime,
          endTime,
          venue: source.venue,
          timezone: source.timezone,
          rsvpDeadline,
          enablePlusOne: source.enablePlusOne,
          enableDietaryPreference: source.enableDietaryPreference,
          viberMessageTemplate: source.viberMessageTemplate,
          createdById: auth.admin.id,
        },
      });

      if (source.emailTemplates.length > 0) {
        await tx.emailTemplate.createMany({
          data: source.emailTemplates.map((template) => ({
            eventId: created.id,
            name: template.name,
            type: template.type,
            subject: template.subject,
            htmlBody: template.htmlBody,
            plainBody: template.plainBody,
            imageUrls: template.imageUrls,
            senderName: template.senderName,
            replyTo: template.replyTo,
            isDefault: template.isDefault,
          })),
        });
      }

      return created;
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to clone event" }, { status: 500 });
  }
}
