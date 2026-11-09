import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EventNav } from "@/components/event-nav";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckSquare, Mail, TrendingUp, Calendar, MapPin, Clock } from "lucide-react";
import { formatDate, formatDateTime, formatTimeAgo } from "@/lib/utils";
import { CloneEventButton } from "@/components/clone-event-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventOverviewPage({ params }: PageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: { select: { guests: true, invitations: true } },
    },
  });

  if (!event) notFound();

  const [rsvpCounts, attendanceCounts, recentActivity] = await Promise.all([
    prisma.guest.groupBy({
      by: ["rsvpStatus"],
      where: { eventId: id },
      _count: true,
    }),
    prisma.guest.groupBy({
      by: ["attendanceStatus"],
      where: { eventId: id },
      _count: true,
    }),
    prisma.activityLog.findMany({
      where: { eventId: id },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { guest: { select: { fullName: true } } },
    }),
  ]);

  const accepted = rsvpCounts.find((r) => r.rsvpStatus === "ACCEPTED")?._count ?? 0;
  const declined = rsvpCounts.find((r) => r.rsvpStatus === "DECLINED")?._count ?? 0;
  const pending = rsvpCounts.find((r) => r.rsvpStatus === "PENDING")?._count ?? 0;
  const checkedIn = attendanceCounts.find((a) => a.attendanceStatus === "CONFIRMED_PRESENT")?._count ?? 0;

  const rsvpRate = event._count.guests > 0 ? Math.round((accepted / event._count.guests) * 100) : 0;

  return (
    <div className="space-y-0">
      <EventNav eventId={id} />

      <div className="p-6 space-y-6">
        {/* Event Details */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold">{event.name}</h2>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(event.startTime)}
                    {event.endTime && ` – ${formatDateTime(event.endTime)}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {event.venue}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  RSVP Deadline: {formatDateTime(event.rsvpDeadline)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CloneEventButton eventId={event.id} eventName={event.name} venue={event.venue} />
                <Badge variant="outline">{event.timezone}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Guests"
            value={event._count.guests}
            icon={Users}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="RSVP Accepted"
            value={accepted}
            subtitle={`${rsvpRate}% acceptance rate`}
            icon={TrendingUp}
            iconColor="text-green-600"
          />
          <StatsCard
            title="RSVP Declined"
            value={declined}
            subtitle={`${pending} pending`}
            icon={Mail}
            iconColor="text-red-600"
          />
          <StatsCard
            title="Checked In"
            value={checkedIn}
            icon={CheckSquare}
            iconColor="text-purple-600"
          />
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{log.description}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
