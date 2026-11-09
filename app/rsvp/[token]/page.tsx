import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RsvpForm } from "@/components/rsvp-form";
import { CalendarLinks } from "@/components/calendar-links";
import { formatDate, formatDateTime } from "@/lib/utils";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function RsvpPage({ params }: PageProps) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      guest: {
        select: {
          id: true,
          fullName: true,
          email: true,
          company: true,
          mobile: true,
          salutation: true,
          rsvpStatus: true,
          declineReason: true,
          dietaryPreference: true,
        },
      },
      event: {
        select: {
          name: true,
          date: true,
          startTime: true,
          endTime: true,
          venue: true,
          rsvpDeadline: true,
          enablePlusOne: true,
          enableDietaryPreference: true,
        },
      },
    },
  });

  if (!invitation) {
    notFound();
  }

  const isExpired =
    invitation.tokenExpiresAt && new Date(invitation.tokenExpiresAt) < new Date();
  const rsvpClosed = new Date(invitation.event.rsvpDeadline) < new Date();
  const hasResponded =
    invitation.guest.rsvpStatus === "ACCEPTED" ||
    invitation.guest.rsvpStatus === "DECLINED";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Event Card */}
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl">{invitation.event.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span>{formatDate(invitation.event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>
                {formatDateTime(invitation.event.startTime)}
                {invitation.event.endTime && ` – ${formatDateTime(invitation.event.endTime)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{invitation.event.venue}</span>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Card */}
        <Card>
          <CardContent className="pt-6">
            {isExpired ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">This invitation link has expired.</p>
              </div>
            ) : rsvpClosed && !hasResponded ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">The RSVP deadline has passed.</p>
              </div>
            ) : hasResponded ? (
              <div className="text-center py-6 space-y-2">
                <div className={`text-4xl ${invitation.guest.rsvpStatus === "ACCEPTED" ? "text-green-600" : "text-red-600"}`}>
                  {invitation.guest.rsvpStatus === "ACCEPTED" ? "✓" : "✗"}
                </div>
                <p className="font-medium">
                  {invitation.guest.rsvpStatus === "ACCEPTED"
                    ? "Thank you! We look forward to seeing you."
                    : "Your response has been recorded. Thank you for letting us know."}
                </p>
                {invitation.guest.rsvpStatus === "ACCEPTED" && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      You have already accepted this invitation.
                    </p>
                    <CalendarLinks
                      googleUrl={buildGoogleCalendarUrl({
                        title: invitation.event.name,
                        start: invitation.event.startTime,
                        end: invitation.event.endTime,
                        location: invitation.event.venue,
                        description: `You're confirmed for ${invitation.event.name}.`,
                      })}
                      icsUrl={`/api/rsvp/${token}/calendar`}
                    />
                  </>
                )}
              </div>
            ) : (
              <RsvpForm
                token={token}
                guestName={invitation.guest.fullName}
                guestEmail={invitation.guest.email}
                guestCompany={invitation.guest.company}
                guestMobile={invitation.guest.mobile}
                salutation={invitation.guest.salutation ?? undefined}
                rsvpDeadline={formatDateTime(invitation.event.rsvpDeadline)}
                enablePlusOne={invitation.event.enablePlusOne}
                enableDietaryPreference={invitation.event.enableDietaryPreference}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
