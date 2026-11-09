"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Send, Trash2, MoreHorizontal, Edit, Download, MessageCircle, BookUser, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestForm } from "@/components/guest-form";
import { BulkImport } from "@/components/bulk-import";
import { cn, getRsvpStatusColor, getCategoryColor, formatDate } from "@/lib/utils";

function openViberApp(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

interface Guest {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  designation: string;
  company: string;
  category: string;
  rsvpStatus: string;
  attendanceStatus: string;
  invitationMethod: string;
  salutation: string | null;
  createdAt: string;
}

interface GuestsClientProps {
  eventId: string;
  initialGuests: Guest[];
  enablePlusOne: boolean;
  enableDietaryPreference: boolean;
  eventDate: string;
}

export function GuestsClient({ eventId, initialGuests, enablePlusOne, enableDietaryPreference, eventDate }: GuestsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [rsvpFilter, setRsvpFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [viberInvite, setViberInvite] = useState<{ phone: string; message: string; viberUrl: string } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [contactResults, setContactResults] = useState<Array<{ id: string; fullName: string; email: string; company: string; designation: string }>>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [addingContactId, setAddingContactId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isPast = new Date(eventDate) < new Date();

  const filtered = initialGuests.filter((g) => {
    const matchSearch =
      !search ||
      g.fullName.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.company.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "ALL" || g.category === categoryFilter;
    const matchRsvp = rsvpFilter === "ALL" || g.rsvpStatus === rsvpFilter;
    return matchSearch && matchCategory && matchRsvp;
  });

  async function searchContacts(query: string) {
    setContactQuery(query);
    setContactLoading(true);
    try {
      const res = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`);
      const data = await res.json().catch(() => []);
      setContactResults(Array.isArray(data) ? data : []);
    } catch {
      setContactResults([]);
    } finally {
      setContactLoading(false);
    }
  }

  function openContactSearch() {
    setContactOpen(true);
    setContactQuery("");
    void searchContacts("");
  }

  async function handleAddContact(contactId: string, email: string) {
    setAddingContactId(contactId);
    try {
      const res = await fetch(`/api/events/${eventId}/guests/from-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to add contact");
      const already = initialGuests.some((guest) => guest.email.toLowerCase() === email.toLowerCase());
      toast.success(data.action === "updated" || already ? "Guest updated from contact" : "Contact added to this event");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setAddingContactId(null);
    }
  }

  async function handleSaveContact(guestId: string) {
    const res = await fetch(`/api/events/${eventId}/guests/${guestId}/save-contact`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(data.action === "updated" ? "Contact updated" : "Saved to contacts");
    } else {
      toast.error(data.error ?? "Failed to save contact");
    }
  }

  async function handleDelete(guestId: string) {
    if (!confirm("Delete this guest?")) return;
    const res = await fetch(`/api/events/${eventId}/guests/${guestId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Guest deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete guest");
    }
  }

  async function handleSendViberInvite(guestId: string) {
    const res = await fetch(`/api/events/${eventId}/guests/${guestId}/viber`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Failed to prepare Viber invite");
      return;
    }

    let copied = false;
    try {
      await navigator.clipboard.writeText(data.message);
      copied = true;
    } catch {
      copied = false;
    }

    setViberInvite({ phone: data.phone, message: data.message, viberUrl: data.viberUrl });
    openViberApp(data.viberUrl);
    toast.success(`Viber opened for ${data.phone}`, {
      description: copied
        ? "The invitation is ready to send. If the message box is empty, paste it."
        : "If the message box is empty, use Open Viber again and allow clipboard access.",
    });
    router.refresh();
  }

  async function handleSendInvitation(guestId: string) {
    const res = await fetch(`/api/events/${eventId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestIds: [guestId] }),
    });
    if (res.ok) {
      toast.success("Invitation sent!");
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed to send invitation");
    }
  }

  async function handleBulkInvite() {
    if (selectedIds.size === 0) {
      toast.error("Select guests first");
      return;
    }
    const res = await fetch(`/api/events/${eventId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestIds: Array.from(selectedIds) }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Sent ${data.sent} invitation(s)`);
      setSelectedIds(new Set());
      router.refresh();
    } else {
      toast.error("Failed to send invitations");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((g) => g.id)));
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {["GENERAL", "VIP", "MEDIA", "SPONSOR", "SPEAKER"].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={rsvpFilter} onValueChange={setRsvpFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="RSVP Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All RSVP</SelectItem>
            {["PENDING", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <BulkImport eventId={eventId} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`/api/events/${eventId}/export?report=guests&format=xlsx`} download>
                Guest List (Excel)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/api/events/${eventId}/export?report=guests&format=csv`} download>
                Guest List (CSV)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/api/events/${eventId}/export?report=no-show&format=xlsx`} download>
                No-Show Report (Excel)
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedIds.size > 0 && (
          <Button variant="outline" onClick={handleBulkInvite} disabled={isPast}>
            <Send className="h-4 w-4 mr-2" />
            Invite {selectedIds.size} selected
          </Button>
        )}

        <Button variant="outline" onClick={openContactSearch}>
          <BookUser className="h-4 w-4 mr-2" />
          Add from contacts
        </Button>

        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} guest(s)</p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>RSVP</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No guests found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(guest.id)}
                      onChange={() => toggleSelect(guest.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {guest.salutation ? `${guest.salutation} ` : ""}{guest.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">{guest.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{guest.company}</p>
                      <p className="text-xs text-muted-foreground">{guest.designation}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", getCategoryColor(guest.category))}>
                      {guest.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", getRsvpStatusColor(guest.rsvpStatus))}>
                      {guest.rsvpStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{guest.attendanceStatus.replace("_", " ")}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditGuest(guest)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSaveContact(guest.id)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Save to contacts
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendInvitation(guest.id)} disabled={isPast}>
                          <Send className="h-4 w-4 mr-2" />
                          Send email invitation
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendViberInvite(guest.id)}
                          disabled={isPast}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Viber invite
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(guest.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viberInvite} onOpenChange={(open) => !open && setViberInvite(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Viber invite for {viberInvite?.phone}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Viber should open a chat with this number and the invitation ready to send.
            If the message box is empty, paste the text below.
          </p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs">
            {viberInvite?.message}
          </pre>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!viberInvite) return;
                try {
                  await navigator.clipboard.writeText(viberInvite.message);
                  toast.success("Invitation copied");
                } catch {
                  toast.error("Could not copy the invitation");
                }
              }}
            >
              Copy message
            </Button>
            <Button asChild>
              <a href={viberInvite?.viberUrl ?? "#"}>Open Viber</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add from contacts</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search name, email, or company..."
              value={contactQuery}
              onChange={(e) => searchContacts(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-80 overflow-auto border rounded-md">
            {contactLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Searching...</p>
            ) : contactResults.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No saved contacts found.</p>
            ) : (
              contactResults.map((contact) => {
                const onEvent = initialGuests.some(
                  (guest) => guest.email.toLowerCase() === contact.email.toLowerCase()
                );
                return (
                  <div key={contact.id} className="flex items-center justify-between gap-3 border-b last:border-0 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{contact.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email} · {contact.company}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={onEvent ? "outline" : "default"}
                      disabled={addingContactId === contact.id}
                      onClick={() => handleAddContact(contact.id, contact.email)}
                    >
                      {addingContactId === contact.id ? "Saving..." : onEvent ? "Update" : "Add"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Guest Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Guest</DialogTitle>
          </DialogHeader>
          <GuestForm
            eventId={eventId}
            enablePlusOne={enablePlusOne}
            enableDietaryPreference={enableDietaryPreference}
            onSuccess={() => { setAddOpen(false); router.refresh(); }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Guest Dialog */}
      <Dialog open={!!editGuest} onOpenChange={(open) => !open && setEditGuest(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Guest</DialogTitle>
          </DialogHeader>
          {editGuest && (
            <GuestForm
              eventId={eventId}
              guest={editGuest as Parameters<typeof GuestForm>[0]["guest"]}
              enablePlusOne={enablePlusOne}
              enableDietaryPreference={enableDietaryPreference}
              onSuccess={() => { setEditGuest(null); router.refresh(); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
