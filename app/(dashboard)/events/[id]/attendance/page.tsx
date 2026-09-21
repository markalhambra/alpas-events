import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EventNav } from "@/components/event-nav";
import { AttendanceClient } from "@/components/attendance-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const PRESENT_STATUSES = [
  "CONFIRMED_PRESENT",
  "WALK_IN_OVERRIDE",
  "UNREGISTERED_WALK_IN",
] as const;

export default async function AttendancePage({ params }: PageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      name: true,
      enablePlusOne: true,
      enableDietaryPreference: true,
    },
  });
  if (!event) notFound();

  const guests = await prisma.guest.findMany({
    where: { eventId: id },
    orderBy: [{ attendanceStatus: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      designation: true,
      category: true,
      rsvpStatus: true,
      attendanceStatus: true,
      attendanceMarkedAt: true,
      salutation: true,
      dietaryPreference: true,
      plusOnes: { select: { id: true, name: true, checkedIn: true } },
    },
  });

  const serialized = guests.map((g) => ({
    ...g,
    attendanceMarkedAt: g.attendanceMarkedAt?.toISOString() ?? null,
  }));

  // Stats
  const checkedIn = guests.filter((g) => g.attendanceStatus === "CONFIRMED_PRESENT").length;
  const walkIns = guests.filter(
    (g) =>
      g.attendanceStatus === "WALK_IN_OVERRIDE" ||
      g.attendanceStatus === "UNREGISTERED_WALK_IN",
  ).length;
  const noShow = guests.filter((g) => g.attendanceStatus === "NO_SHOW").length;

  const allPlusOnes = guests.flatMap((g) => g.plusOnes);
  const plusOneTotal = allPlusOnes.length;
  const plusOneCheckedIn = allPlusOnes.filter((p) => p.checkedIn).length;
  const dietaryCount = guests.filter(
    (g) => g.dietaryPreference && g.dietaryPreference.trim().length > 0,
  ).length;
  const presentCount = guests.filter((g) =>
    (PRESENT_STATUSES as readonly string[]).includes(g.attendanceStatus),
  ).length;

  const statCardCount =
    3 + (event.enablePlusOne ? 1 : 0) + (event.enableDietaryPreference ? 1 : 0);

  return (
    <div className="space-y-0">
      <EventNav eventId={id} />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>

        <div
          className={`grid gap-4 ${
            statCardCount <= 3
              ? "grid-cols-3 max-w-md"
              : statCardCount === 4
                ? "grid-cols-2 sm:grid-cols-4 max-w-2xl"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-4xl"
          }`}
        >
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{checkedIn}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{walkIns}</p>
            <p className="text-xs text-muted-foreground">Walk-ins</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{noShow}</p>
            <p className="text-xs text-muted-foreground">No-shows</p>
          </div>
          {event.enablePlusOne && (
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {plusOneCheckedIn}
                <span className="text-base font-normal text-muted-foreground">
                  /{plusOneTotal}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Plus-ones in</p>
            </div>
          )}
          {event.enableDietaryPreference && (
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-sky-600">{dietaryCount}</p>
              <p className="text-xs text-muted-foreground">With dietary pref.</p>
              {presentCount > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  of {presentCount} present guests tracked
                </p>
              )}
            </div>
          )}
        </div>

        <AttendanceClient
          eventId={id}
          initialGuests={serialized}
          enablePlusOne={event.enablePlusOne}
          enableDietaryPreference={event.enableDietaryPreference}
        />
      </div>
    </div>
  );
}
