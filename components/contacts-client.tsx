"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Contact {
  id: string;
  fullName: string;
  email: string;
  designation: string;
  company: string;
  mobile: string | null;
  salutation: string | null;
  category: string;
}

const SALUTATIONS = ["MR", "MS", "MRS", "DR", "ENGR", "ATTY", "PROF"];
const CATEGORIES = ["GENERAL", "VIP", "MEDIA", "SPONSOR", "SPEAKER"];

const emptyForm = {
  fullName: "",
  email: "",
  designation: "",
  company: "",
  mobile: "",
  salutation: "",
  category: "GENERAL",
};

export function ContactsClient({ initialContacts }: { initialContacts: Contact[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const filtered = initialContacts.filter((contact) => {
    const q = search.toLowerCase();
    return (
      !q ||
      contact.fullName.toLowerCase().includes(q) ||
      contact.email.toLowerCase().includes(q) ||
      contact.company.toLowerCase().includes(q)
    );
  });

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(contact: Contact) {
    setEditing(contact);
    setForm({
      fullName: contact.fullName,
      email: contact.email,
      designation: contact.designation,
      company: contact.company,
      mobile: contact.mobile ?? "",
      salutation: contact.salutation ?? "",
      category: contact.category,
    });
    setOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const payload = {
        ...form,
        salutation: form.salutation || undefined,
        mobile: form.mobile || undefined,
      };
      const res = await fetch(editing ? `/api/contacts/${editing.id}` : "/api/contacts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save contact");
      toast.success(editing ? "Contact updated" : "Contact saved");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(contact: Contact) {
    if (!confirm(`Delete ${contact.fullName} from contacts? Guests already added to events will stay.`)) return;
    const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Contact deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete contact");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add contact
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} contact(s)</p>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company / Publication</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{contact.fullName}</p>
                    <p className="text-xs text-muted-foreground">{contact.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{contact.company}</p>
                    <p className="text-xs text-muted-foreground">{contact.designation}</p>
                  </TableCell>
                  <TableCell className="text-sm">{contact.mobile ?? "—"}</TableCell>
                  <TableCell className="text-sm">{contact.category}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(contact)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(contact)}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit contact" : "Add contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Salutation</Label>
                <Select value={form.salutation || "NONE"} onValueChange={(v) => setForm({ ...form, salutation: v === "NONE" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {SALUTATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Full name *</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="0917xxxxxxx" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Designation *</Label>
                <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Company / Publication *</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !form.fullName.trim() || !form.email.trim() || !form.designation.trim() || !form.company.trim()}>
              {loading ? "Saving..." : "Save contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
