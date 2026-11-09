import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function ShortRsvpPage({ params }: PageProps) {
  const { code } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { shortCode: code },
    select: { token: true },
  });
  if (!invitation) notFound();
  redirect(`/rsvp/${invitation.token}`);
}
