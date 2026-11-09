export interface CalendarEventInput {
  title: string;
  start: Date;
  end: Date | null;
  location: string;
  description?: string;
}

function resolveEnd(start: Date, end: Date | null): Date {
  if (end && end.getTime() > start.getTime()) return end;
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const end = resolveEnd(event.start, event.end);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toUtcStamp(event.start)}/${toUtcStamp(end)}`,
    location: event.location,
  });
  if (event.description) params.set("details", event.description);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(event: CalendarEventInput, uid: string): string {
  const end = resolveEnd(event.start, event.end);
  const description = event.description ?? "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alpas Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${icsEscape(uid)}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `LOCATION:${icsEscape(event.location)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export function buildIcsUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/rsvp/${token}/calendar`;
}

export function calendarLinksHtml(googleUrl: string, icsUrl: string): string {
  return `<p style="margin:16px 0;">Add this event to your calendar: <a href="${googleUrl}">Google Calendar</a> · <a href="${icsUrl}">Apple Calendar</a></p>`;
}
