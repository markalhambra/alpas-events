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

export function buildViberInvitationMessage(data: ViberInvitationInput): string {
  const title = data.salutation ? SALUTATION_LABEL[data.salutation] ?? data.salutation : "";
  const greeting = [title, data.guestName].filter(Boolean).join(" ");

  return [
    `Hi ${greeting}, you're invited to ${data.eventName}.`,
    "",
    `Date: ${data.eventDate}`,
    `Time: ${data.eventTime}`,
    `Venue: ${data.venue}`,
    `RSVP by: ${data.rsvpDeadline}`,
    "",
    `Please confirm here: ${data.rsvpUrl}`,
  ].join("\n");
}

/**
 * Opens a 1:1 Viber chat with this number on phone and desktop.
 * `text` is included so clients that support a draft message can prefill it.
 * Viber's documented share link (`viber://forward?text=`) prefills text but
 * cannot target a number, and trims text to 200 characters.
 */
export function buildViberChatUrl(internationalDigits: string, text: string): string {
  const encoded = encodeURIComponent(text);
  // `text` and `draft` are both sent. Viber officially prefills text only on
  // viber://forward, which cannot target a number. Some app builds read one of
  // these params on viber://chat; others ignore them.
  return `viber://chat?number=%2B${internationalDigits}&text=${encoded}&draft=${encoded}`;
}
