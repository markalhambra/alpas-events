"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, getRsvpStatusColor, formatDateTime, formatTimeAgo } from "@/lib/utils";

interface Invitation {
  id: string;
  guestId: string;
  method: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  resendCount: number;
  lastResentAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  guest: {
    fullName: string;
    email: string;
    category: string;
  };
}

interface InvitationsClientProps {
  eventId: string;
  initialInvitations: Invitation[];
  eventDate: string;
}

export function InvitationsClient({ eventId, initialInvitations, eventDate }: InvitationsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const isPast = new Date(eventDate) < new Date();

  const filtered = initialInvitations.filter((inv) => {
    const q = search.toLowerCase();
    return (
      !search ||
      inv.guest.fullName.toLowerCase().includes(q) ||
      inv.guest.email.toLowerCase().includes(q)
    );
  });

  async function handleResend(invitationId: string) {
    const res = await fetch(`/api/events/${eventId}/invitations/${invitationId}/resend`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Invitation resent");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to resend invitation");
    }
  }

  function formatMethod(method: string) {
    if (method === "VIBER") return "Viber";
    if (method === "QR_CODE") return "QR Code";
    if (method === "BOTH") return "Email + QR";
    if (method === "EMAIL") return "Email";
    return method;
  }

  function getStatus(inv: Invitation) {
    if (inv.failedAt) return { label: "Failed", color: "bg-red-100 text-red-800" };
    if (inv.clickedAt) return { label: "Clicked", color: "bg-green-100 text-green-800" };
    if (inv.openedAt) return { label: "Opened", color: "bg-blue-100 text-blue-800" };
    if (inv.sentAt) return { label: "Sent", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Pending", color: "bg-gray-100 text-gray-800" };
  }

  return (
    <div className="space-y-4">
      {isPast && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          This event has already passed. Sending and resending invitations is disabled.
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} invitation(s)</p>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Resends</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No invitations found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const status = getStatus(inv);
                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{inv.guest.fullName}</p>
                        <p className="text-xs text-muted-foreground">{inv.guest.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatMethod(inv.method)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {inv.sentAt ? formatTimeAgo(inv.sentAt) : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{inv.resendCount}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(inv.id)}
                        disabled={isPast}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Resend
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
