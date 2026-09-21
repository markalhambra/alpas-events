import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id: eventId } = await params;
  const { searchParams } = new URL(req.url);
  const report = searchParams.get("report") ?? "guests";
  const format = searchParams.get("format") ?? "xlsx";

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let rows: Record<string, unknown>[] = [];
  let sheetName = "Guests";

  if (report === "guests") {
    const guests = await prisma.guest.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
        fullName: true,
        salutation: true,
        company: true,
        designation: true,
        email: true,
        mobile: true,
        category: true,
        rsvpStatus: true,
        attendanceStatus: true,
        dietaryPreference: true,
        plusOnes: { select: { name: true, checkedIn: true } },
        createdAt: true,
      },
    });
    sheetName = "All Guests";
    rows = guests.map((g) => ({
      "Full Name": g.fullName,
      "Salutation": g.salutation ?? "",
      "Company": g.company ?? "",
      "Designation": g.designation ?? "",
      "Email": g.email ?? "",
      "Mobile": g.mobile ?? "",
      "Category": g.category,
      "RSVP Status": g.rsvpStatus,
      "Attendance Status": g.attendanceStatus,
      "Dietary Preference": g.dietaryPreference ?? "",
      "Plus-One Names": g.plusOnes.map((p) => p.name).join(", "),
      "Plus-Ones Checked In": g.plusOnes.filter((p) => p.checkedIn).map((p) => p.name).join(", "),
      "Registered At": g.createdAt.toISOString(),
    }));
  } else if (report === "attendance") {
    const guests = await prisma.guest.findMany({
      where: { eventId },
      orderBy: [{ attendanceStatus: "asc" }, { fullName: "asc" }],
      select: {
        fullName: true,
        salutation: true,
        company: true,
        category: true,
        rsvpStatus: true,
        attendanceStatus: true,
        attendanceMarkedAt: true,
        dietaryPreference: true,
        plusOnes: { select: { name: true, checkedIn: true, checkedInAt: true } },
      },
    });
    sheetName = "Attendance";
    rows = guests.map((g) => ({
      "Full Name": g.fullName,
      "Salutation": g.salutation ?? "",
      "Company": g.company ?? "",
      "Category": g.category,
      "RSVP Status": g.rsvpStatus,
      "Attendance Status": g.attendanceStatus,
      "Checked In At": g.attendanceMarkedAt ? g.attendanceMarkedAt.toISOString() : "",
      "Dietary Preference": g.dietaryPreference ?? "",
      "Plus-One Names": g.plusOnes.map((p) => p.name).join(", "),
      "Plus-Ones Checked In": g.plusOnes.filter((p) => p.checkedIn).map((p) => p.name).join(", "),
    }));
  } else if (report === "no-show") {
    const guests = await prisma.guest.findMany({
      where: { eventId, rsvpStatus: "ACCEPTED", attendanceStatus: "NO_SHOW" },
      orderBy: { fullName: "asc" },
      select: {
        fullName: true,
        salutation: true,
        company: true,
        email: true,
        mobile: true,
        category: true,
        dietaryPreference: true,
        plusOnes: { select: { name: true } },
      },
    });
    sheetName = "No Shows";
    rows = guests.map((g) => ({
      "Full Name": g.fullName,
      "Salutation": g.salutation ?? "",
      "Company": g.company ?? "",
      "Email": g.email ?? "",
      "Mobile": g.mobile ?? "",
      "Category": g.category,
      "Dietary Preference": g.dietaryPreference ?? "",
      "Plus-One Names": g.plusOnes.map((p) => p.name).join(", "),
    }));
  } else {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  const safeName = event.name.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
  const filename = `${safeName}_${report}`;

  if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  // Default: xlsx
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
