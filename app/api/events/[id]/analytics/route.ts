import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

const PRESENT = ["CONFIRMED_PRESENT", "WALK_IN_OVERRIDE", "UNREGISTERED_WALK_IN"] as const;

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id: eventId } = await params;

  const [event, rsvpGroups, attendanceGroups, categoryGroups, guests, checkInTimeline] =
    await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: { enablePlusOne: true, enableDietaryPreference: true },
      }),
      prisma.guest.groupBy({
        by: ["rsvpStatus"],
        where: { eventId },
        _count: true,
      }),
      prisma.guest.groupBy({
        by: ["attendanceStatus"],
        where: { eventId },
        _count: true,
      }),
      prisma.guest.groupBy({
        by: ["category"],
        where: { eventId },
        _count: true,
      }),
      prisma.guest.findMany({
        where: { eventId },
        select: {
          rsvpStatus: true,
          attendanceStatus: true,
          createdAt: true,
          category: true,
          dietaryPreference: true,
          plusOnes: { select: { name: true, checkedIn: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.guest.findMany({
        where: {
          eventId,
          attendanceStatus: { in: [...PRESENT] },
          attendanceMarkedAt: { not: null },
        },
        select: { attendanceMarkedAt: true },
        orderBy: { attendanceMarkedAt: "asc" },
      }),
    ]);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const rsvpBreakdown = ["ACCEPTED", "DECLINED", "PENDING", "SENT", "EXPIRED"].map((status) => ({
    status,
    count: rsvpGroups.find((g) => g.rsvpStatus === status)?._count ?? 0,
  }));

  const attendanceBreakdown = [
    "CONFIRMED_PRESENT",
    "NOT_YET",
    "WALK_IN_OVERRIDE",
    "UNREGISTERED_WALK_IN",
    "NO_SHOW",
    "EXCUSED_ABSENCE",
  ].map((status) => ({
    status,
    label: status.replace(/_/g, " "),
    count: attendanceGroups.find((g) => g.attendanceStatus === status)?._count ?? 0,
  }));

  const categoryBreakdown = ["GENERAL", "VIP", "MEDIA", "SPONSOR", "SPEAKER"].map((cat) => ({
    category: cat,
    total: categoryGroups.find((g) => g.category === cat)?._count ?? 0,
    accepted: guests.filter((g) => g.category === cat && g.rsvpStatus === "ACCEPTED").length,
    present: guests.filter(
      (g) =>
        g.category === cat && (PRESENT as readonly string[]).includes(g.attendanceStatus),
    ).length,
  }));

  const dayMap: Record<string, number> = {};
  for (const g of guests) {
    const day = g.createdAt.toISOString().slice(0, 10);
    dayMap[day] = (dayMap[day] ?? 0) + 1;
  }
  let cumulative = 0;
  const registrationGrowth = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    });

  const hourMap: Record<string, number> = {};
  for (const g of checkInTimeline) {
    if (!g.attendanceMarkedAt) continue;
    const hour = g.attendanceMarkedAt.toISOString().slice(0, 13);
    hourMap[hour] = (hourMap[hour] ?? 0) + 1;
  }
  const checkInByHour = Object.entries(hourMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({
      hour: `${hour.slice(11)}:00`,
      count,
    }));

  const allPlusOnes = guests.flatMap((g) => g.plusOnes);
  const plusOneSummary = {
    total: allPlusOnes.length,
    checkedIn: allPlusOnes.filter((p) => p.checkedIn).length,
    guestsWithPlusOnes: guests.filter((g) => g.plusOnes.length > 0).length,
  };

  const dietaryMap = new Map<string, { preference: string; count: number }>();
  for (const g of guests) {
    const raw = g.dietaryPreference?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const existing = dietaryMap.get(key);
    if (existing) existing.count += 1;
    else dietaryMap.set(key, { preference: raw, count: 1 });
  }
  const dietaryBreakdown = Array.from(dietaryMap.values()).sort((a, b) => b.count - a.count);
  const guestsWithDietary = dietaryBreakdown.reduce((sum, d) => sum + d.count, 0);

  const total = guests.length;
  const accepted = guests.filter((g) => g.rsvpStatus === "ACCEPTED").length;
  const present = guests.filter((g) =>
    (PRESENT as readonly string[]).includes(g.attendanceStatus),
  ).length;
  const noShow = guests.filter((g) => g.attendanceStatus === "NO_SHOW").length;
  const headcount = present + plusOneSummary.checkedIn;

  return NextResponse.json({
    enablePlusOne: event.enablePlusOne,
    enableDietaryPreference: event.enableDietaryPreference,
    summary: {
      total,
      accepted,
      present,
      noShow,
      headcount,
      guestsWithDietary,
      rsvpRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      attendanceRate: accepted > 0 ? Math.round((present / accepted) * 100) : 0,
      noShowRate: accepted > 0 ? Math.round((noShow / accepted) * 100) : 0,
    },
    rsvpBreakdown,
    attendanceBreakdown,
    categoryBreakdown,
    registrationGrowth,
    checkInByHour,
    plusOneSummary,
    dietaryBreakdown,
  });
}
