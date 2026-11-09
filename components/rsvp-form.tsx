"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { CalendarLinks } from "@/components/calendar-links";

interface RsvpFormProps {
  token: string;
  guestName: string;
  guestEmail: string;
  guestCompany?: string | null;
  guestMobile?: string | null;
  salutation?: string;
  rsvpDeadline: string;
  enablePlusOne: boolean;
  enableDietaryPreference: boolean;
}

export function RsvpForm({ token, guestName, guestEmail, guestCompany, guestMobile, salutation, rsvpDeadline, enablePlusOne, enableDietaryPreference }: RsvpFormProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<"ACCEPTED" | "DECLINED" | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [plusOneNames, setPlusOneNames] = useState<string[]>([]);
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [fullName, setFullName] = useState(guestName);
  const [email, setEmail] = useState(guestEmail);
  const [company, setCompany] = useState(guestCompany ?? "");
  const [mobile, setMobile] = useState(guestMobile ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [calendar, setCalendar] = useState<{ googleUrl: string; icsUrl: string } | null>(null);

  async function handleSubmit(choice: "ACCEPTED" | "DECLINED") {
    if (choice === "ACCEPTED" && (!fullName.trim() || !email.trim())) {
      toast.error("Full name and email are required");
      return;
    }

    setResponse(choice);
    setLoading(true);

    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: choice,
          declineReason: choice === "DECLINED" ? declineReason : undefined,
          plusOneNames: choice === "ACCEPTED" ? plusOneNames.filter(Boolean) : undefined,
          dietaryPreference: choice === "ACCEPTED" ? dietaryPreference : undefined,
          fullName: choice === "ACCEPTED" ? fullName.trim() : undefined,
          email: choice === "ACCEPTED" ? email.trim() : undefined,
          company: choice === "ACCEPTED" ? company.trim() : undefined,
          mobile: choice === "ACCEPTED" ? mobile.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof data.error === "string" ? data.error : "Failed to submit RSVP";
        throw new Error(message);
      }

      if (data.googleCalendarUrl && data.icsUrl) {
        setCalendar({ googleUrl: data.googleCalendarUrl, icsUrl: data.icsUrl });
      }
      setSubmitted(true);
      toast.success(choice === "ACCEPTED" ? "Thank you for accepting!" : "Response recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit RSVP");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className={`text-5xl ${response === "ACCEPTED" ? "text-green-600" : "text-red-600"}`}>
          {response === "ACCEPTED" ? "✓" : "✗"}
        </div>
        <h3 className="font-semibold text-lg">
          {response === "ACCEPTED" ? "See you there!" : "Thank you for letting us know"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {response === "ACCEPTED"
            ? "Your attendance has been confirmed. We look forward to seeing you!"
            : "We're sorry you can't make it. Your response has been recorded."}
        </p>
        {response === "ACCEPTED" && calendar && (
          <CalendarLinks googleUrl={calendar.googleUrl} icsUrl={calendar.icsUrl} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-medium">
          Dear {salutation ? `${salutation} ` : ""}{guestName},
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Please confirm your attendance. RSVP deadline: {rsvpDeadline}
        </p>
      </div>

      {/* Acceptance form */}
      {response === "ACCEPTED" ? (
        <div className="space-y-3 p-4 bg-green-50 rounded-lg">
          <p className="font-medium text-green-800 text-sm">Accepting invitation</p>
          <div className="space-y-1">
            <Label className="text-xs">Full name *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white" maxLength={100} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white" maxLength={255} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Company / Publication</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-white" maxLength={120} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mobile</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="0917xxxxxxx or +63917xxxxxxx" className="bg-white" maxLength={30} />
          </div>
          {enablePlusOne && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Plus One(s) (optional)</Label>
                <button
                  type="button"
                  className="text-xs text-green-700 underline flex items-center gap-1"
                  onClick={() => setPlusOneNames((prev) => [...prev, ""])}
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {plusOneNames.map((name, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={name}
                    onChange={(e) =>
                      setPlusOneNames((prev) =>
                        prev.map((v, i) => (i === idx ? e.target.value : v))
                      )
                    }
                    placeholder={`Guest ${idx + 1} name`}
                    className="bg-white"
                  />
                  <button
                    type="button"
                    className="text-destructive"
                    onClick={() => setPlusOneNames((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {enableDietaryPreference && (
            <div className="space-y-1">
              <Label className="text-xs">Dietary Preference (optional)</Label>
              <Input
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
                placeholder="Vegetarian, Halal, etc."
                className="bg-white"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit("ACCEPTED")}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? "Submitting..." : "Confirm Attendance"}
            </Button>
            <Button variant="outline" onClick={() => setResponse(null)}>
              Back
            </Button>
          </div>
        </div>
      ) : response === "DECLINED" ? (
        <div className="space-y-3 p-4 bg-red-50 rounded-lg">
          <p className="font-medium text-red-800 text-sm">Declining invitation</p>
          <div className="space-y-1">
            <Label className="text-xs">Reason (optional)</Label>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please let us know why..."
              rows={3}
              className="bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit("DECLINED")}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? "Submitting..." : "Decline Invitation"}
            </Button>
            <Button variant="outline" onClick={() => setResponse(null)}>
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setResponse("ACCEPTED")}
            className="h-16 text-base bg-green-600 hover:bg-green-700"
          >
            ✓ Accept
          </Button>
          <Button
            onClick={() => setResponse("DECLINED")}
            variant="destructive"
            className="h-16 text-base"
          >
            ✗ Decline
          </Button>
        </div>
      )}
    </div>
  );
}
