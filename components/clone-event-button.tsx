"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CloneEventButtonProps {
  eventId: string;
  eventName: string;
  venue: string;
}

export function CloneEventButton({ eventId, eventName, venue }: CloneEventButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(`Copy of ${eventName}`);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");

  async function handleClone() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date,
          startTime,
          endTime: endTime || undefined,
          rsvpDeadline,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to clone event");
      toast.success("Event cloned");
      setOpen(false);
      router.push(`/events/${data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clone event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Copy className="h-4 w-4 mr-2" />
        Clone event
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clone event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Copies venue ({venue}), RSVP options, and email templates. Guests and seating are not copied.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Event name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start time</Label>
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>End time</Label>
                <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>RSVP deadline</Label>
              <Input type="datetime-local" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={loading || !name.trim() || !date || !startTime || !rsvpDeadline}>
              {loading ? "Cloning..." : "Clone event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
