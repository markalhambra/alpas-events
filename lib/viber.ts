const SALUTATION_LABEL: Record<string, string> = {
  MR: "Mr.",
  MS: "Ms.",
  MRS: "Mrs.",
  DR: "Dr.",
  ENGR: "Engr.",
  ATTY: "Atty.",
  PROF: "Prof.",
};

export interface ViberInvitationInput {
  guestName: string;
  salutation?: string | null;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  rsvpDeadline: string;
  rsvpUrl: string;
}

/**
 * Normalize a stored mobile number to Viber's international digits (no +).
 * Local numbers that look Philippine (09…, 9…, or a leading 0) get country code 63.
 */
export function toViberNumber(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;

  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);

  const looksLocal =
    !hasPlus &&
    (digits.startsWith("0") || (digits.length === 10 && digits.startsWith("9")));

  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (looksLocal && !digits.startsWith("63")) digits = `63${digits}`;

  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function formatViberNumber(digits: string): string {
  return `+${digits}`;
}

/** Viber's chat draft keeps only the first 100 characters. */
export const VIBER_DRAFT_LIMIT = 100;

export function buildShortRsvpUrl(shortCode: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/r/${shortCode}`;
}

function clockTime(eventDate: string, eventTime: string): string {
  if (eventTime.startsWith(eventDate)) return eventTime.slice(eventDate.length).trim();
  return eventTime;
}

function shortDay(value: string): string {
  return value.replace(/,?\s+\d{4}/, "").trim();
}

/**
 * A draft Viber will actually insert. The RSVP link is always included.
 * Longer wording is dropped until the text fits the 100-character limit.
 */
export function buildViberDraft(data: ViberInvitationInput): string {
  const url = data.rsvpUrl.trim();
  const title = data.salutation ? SALUTATION_LABEL[data.salutation] ?? "" : "";
  const named = [title, data.guestName].filter(Boolean).join(" ");
  const time = clockTime(data.eventDate, data.eventTime);
  const when = [shortDay(data.eventDate), time].filter(Boolean).join(" ");
  const where = data.venue.trim();
  const deadline = shortDay(data.rsvpDeadline);
  const attempts = [
    [`Hi ${named} — ${data.eventName}`, [when, where].filter(Boolean).join(", "), deadline ? `RSVP by ${deadline}` : ""],
    [`Hi ${data.guestName} — ${data.eventName}`, [when, where].filter(Boolean).join(", ")],
    [`${named} — ${data.eventName}`, [when, where].filter(Boolean).join(", ")],
    [`${data.guestName}, ${data.eventName}`, when],
    [`${data.eventName}`, when],
    [data.eventName],
    [],
  ];

  for (const lines of attempts) {
    const text = [...lines.map((line) => line.trim()).filter(Boolean), url].join("\n");
    if (url && text.length <= VIBER_DRAFT_LIMIT) return text;
  }

  return url.length <= VIBER_DRAFT_LIMIT ? url : url.slice(-VIBER_DRAFT_LIMIT);
}

export const DEFAULT_VIBER_MESSAGE_TEMPLATE = `Hi {{salutation}} {{guestName}}, you're invited to {{eventName}}.

Date: {{eventDate}}
Time: {{eventTime}}
Venue: {{venue}}
RSVP by: {{rsvpDeadline}}

Please confirm here: {{rsvpUrl}}`;

export const VIBER_TEMPLATE_PLACEHOLDERS = [
  "{{guestName}}",
  "{{salutation}}",
  "{{eventName}}",
  "{{eventDate}}",
  "{{eventTime}}",
  "{{venue}}",
  "{{rsvpDeadline}}",
  "{{rsvpUrl}}",
] as const;

export function renderViberMessage(template: string | null | undefined, data: ViberInvitationInput): string {
  const source = template?.trim() ? template : DEFAULT_VIBER_MESSAGE_TEMPLATE;
  const title = data.salutation ? SALUTATION_LABEL[data.salutation] ?? data.salutation : "";
  const values: Record<string, string> = {
    guestName: data.guestName,
    salutation: title,
    eventName: data.eventName,
    eventDate: data.eventDate,
    eventTime: data.eventTime,
    venue: data.venue,
    rsvpDeadline: data.rsvpDeadline,
    rsvpUrl: data.rsvpUrl,
    acceptUrl: data.rsvpUrl,
  };
  return source
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/**
 * Opens a 1:1 Viber chat with this number on phone and desktop.
 * `text` is included so clients that support a draft message can prefill it.
 * Viber's documented share link (`viber://forward?text=`) prefills text but
 * cannot target a number, and trims text to 200 characters.
 */
export function buildViberChatUrl(internationalDigits: string, draft: string): string {
  // Only `draft` is sent. A `text` param is capped at 100 characters and was
  // cutting the invite off before the RSVP link.
  return `viber://chat?number=%2B${internationalDigits}&draft=${encodeURIComponent(draft)}`;
}
