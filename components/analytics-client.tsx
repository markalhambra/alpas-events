"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckSquare, TrendingUp, XCircle, UserPlus, Utensils } from "lucide-react";

interface Summary {
  total: number;
  accepted: number;
  present: number;
  noShow: number;
  headcount?: number;
  guestsWithDietary?: number;
  rsvpRate: number;
  attendanceRate: number;
  noShowRate: number;
}

interface AnalyticsData {
  enablePlusOne?: boolean;
  enableDietaryPreference?: boolean;
  summary: Summary;
  rsvpBreakdown: { status: string; count: number }[];
  attendanceBreakdown: { status: string; label: string; count: number }[];
  categoryBreakdown: { category: string; total: number; accepted: number; present: number }[];
  registrationGrowth: { date: string; count: number; cumulative: number }[];
  checkInByHour: { hour: string; count: number }[];
  plusOneSummary?: {
    total: number;
    checkedIn: number;
    guestsWithPlusOnes: number;
  };
  dietaryBreakdown?: { preference: string; count: number }[];
}

const RSVP_COLORS: Record<string, string> = {
  ACCEPTED: "#22c55e",
  DECLINED: "#ef4444",
  PENDING: "#eab308",
  SENT: "#3b82f6",
  EXPIRED: "#9ca3af",
};

const ATTENDANCE_COLORS: Record<string, string> = {
  "CONFIRMED PRESENT": "#22c55e",
  "NOT YET": "#9ca3af",
  "WALK IN OVERRIDE": "#a855f7",
  "UNREGISTERED WALK IN": "#f97316",
  "NO SHOW": "#ef4444",
  "EXCUSED ABSENCE": "#3b82f6",
};

const DIETARY_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsClient({ eventId }: { eventId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/analytics`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5 h-24 animate-pulse bg-muted/40 rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Failed to load analytics.</p>;

  const {
    enablePlusOne,
    enableDietaryPreference,
    summary,
    rsvpBreakdown,
    attendanceBreakdown,
    categoryBreakdown,
    registrationGrowth,
    checkInByHour,
    plusOneSummary,
    dietaryBreakdown = [],
  } = data;

  const rsvpPieData = rsvpBreakdown.filter((d) => d.count > 0);
  const attendancePieData = attendanceBreakdown.filter((d) => d.count > 0);
  const showPlusOne = Boolean(enablePlusOne);
  const showDietary = Boolean(enableDietaryPreference);
  const extraStatCount = (showPlusOne ? 1 : 0) + (showDietary ? 1 : 0);

  return (
    <div className="space-y-6">
      <div
        className={`grid gap-4 ${
          extraStatCount === 0
            ? "grid-cols-2 lg:grid-cols-4"
            : extraStatCount === 1
              ? "grid-cols-2 lg:grid-cols-5"
              : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        }`}
      >
        <StatCard
          label="Total Guests"
          value={summary.total}
          icon={Users}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="RSVP Rate"
          value={`${summary.rsvpRate}%`}
          sub={`${summary.accepted} accepted`}
          icon={TrendingUp}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="Attendance Rate"
          value={`${summary.attendanceRate}%`}
          sub={`${summary.present} checked in`}
          icon={CheckSquare}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          label="No-Show Rate"
          value={`${summary.noShowRate}%`}
          sub={`${summary.noShow} no-shows`}
          icon={XCircle}
          color="bg-red-100 text-red-700"
        />
        {showPlusOne && plusOneSummary && (
          <StatCard
            label="Plus-Ones"
            value={`${plusOneSummary.checkedIn}/${plusOneSummary.total}`}
            sub={`${plusOneSummary.guestsWithPlusOnes} guests · headcount ${summary.headcount ?? summary.present + plusOneSummary.checkedIn}`}
            icon={UserPlus}
            color="bg-violet-100 text-violet-700"
          />
        )}
        {showDietary && (
          <StatCard
            label="Dietary Prefs"
            value={summary.guestsWithDietary ?? dietaryBreakdown.reduce((s, d) => s + d.count, 0)}
            sub={`${dietaryBreakdown.length} distinct`}
            icon={Utensils}
            color="bg-sky-100 text-sky-700"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">RSVP Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={rsvpPieData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : "0"}%`
                  }
                  labelLine={false}
                >
                  {rsvpPieData.map((entry) => (
                    <Cell key={entry.status} fill={RSVP_COLORS[entry.status] ?? "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={attendancePieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${percent ? (percent * 100).toFixed(0) : "0"}%`
                  }
                  labelLine={false}
                >
                  {attendancePieData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={ATTENDANCE_COLORS[entry.label] ?? "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {(showPlusOne || showDietary) && (
        <div
          className={`grid gap-6 ${
            showPlusOne && showDietary ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {showPlusOne && plusOneSummary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Plus-One Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{plusOneSummary.total}</p>
                    <p className="text-xs text-muted-foreground">Total plus-ones</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {plusOneSummary.checkedIn}
                    </p>
                    <p className="text-xs text-muted-foreground">Checked in</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-violet-600">
                      {plusOneSummary.guestsWithPlusOnes}
                    </p>
                    <p className="text-xs text-muted-foreground">Guests with +1</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={[
                      {
                        label: "Plus-ones",
                        checkedIn: plusOneSummary.checkedIn,
                        pending: Math.max(
                          0,
                          plusOneSummary.total - plusOneSummary.checkedIn,
                        ),
                      },
                    ]}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="checkedIn" name="Checked in" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Not checked in" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {showDietary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Dietary Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                {dietaryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No dietary preferences recorded yet.
                  </p>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(220, dietaryBreakdown.length * 36)}
                  >
                    <BarChart
                      data={dietaryBreakdown}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="preference"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name="Guests" radius={[0, 4, 4, 0]}>
                        {dietaryBreakdown.map((_, i) => (
                          <Cell
                            key={i}
                            fill={DIETARY_COLORS[i % DIETARY_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By Guest Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryBreakdown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="accepted" name="Accepted" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {registrationGrowth.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Guest Registration Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={registrationGrowth}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="Total Guests"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Added Per Day"
                  stroke="#a5b4fc"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {checkInByHour.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Check-in Timeline (by Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={checkInByHour} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Check-ins" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
