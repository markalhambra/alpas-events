"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { guestSchema, type GuestInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GuestFormProps {
  eventId: string;
  guest?: GuestInput & { id: string; plusOnes?: { id: string; name: string }[] };
  enablePlusOne?: boolean;
  enableDietaryPreference?: boolean;
  onSuccess?: () => void;
}

export function GuestForm({ eventId, guest, enablePlusOne = true, enableDietaryPreference = true, onSuccess }: GuestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plusOneNames, setPlusOneNames] = useState<string[]>(
    guest?.plusOnes?.map((p) => p.name) ?? (guest?.plusOneNames ?? [])
  );
  const isEdit = !!guest;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GuestInput>({
    resolver: zodResolver(guestSchema),
    defaultValues: guest ?? {
      category: "GENERAL",
      invitationMethod: "EMAIL",
    },
  });

  const category = watch("category");
  const invitationMethod = watch("invitationMethod");
  const salutation = watch("salutation");

  async function onSubmit(data: GuestInput) {
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/events/${eventId}/guests/${guest.id}`
        : `/api/events/${eventId}/guests`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, plusOneNames: plusOneNames.filter(Boolean) }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save guest");
      }

      toast.success(isEdit ? "Guest updated" : "Guest added successfully");
      router.refresh();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Salutation</Label>
          <Select
            value={salutation ?? ""}
            onValueChange={(v) => setValue("salutation", v as GuestInput["salutation"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {["MR", "MS", "MRS", "DR", "ENGR", "ATTY", "PROF"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Full Name *</Label>
          <Input {...register("fullName")} placeholder="Juan Dela Cruz" />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Email *</Label>
          <Input {...register("email")} type="email" placeholder="juan@example.com" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Mobile</Label>
          <Input {...register("mobile")} placeholder="0917xxxxxxx or +63917xxxxxxx" />
          {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Designation *</Label>
          <Input {...register("designation")} placeholder="CEO" />
          {errors.designation && <p className="text-xs text-destructive">{errors.designation.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Company / Publication *</Label>
          <Input {...register("company")} placeholder="Acme Corp or publication name" />
          {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setValue("category", v as GuestInput["category"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GENERAL", "VIP", "MEDIA", "SPONSOR", "SPEAKER"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Invitation Method</Label>
          <Select
            value={invitationMethod}
            onValueChange={(v) => setValue("invitationMethod", v as GuestInput["invitationMethod"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="QR_CODE">QR Code</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {enablePlusOne && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label>Plus One(s)</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setPlusOneNames((prev) => [...prev, ""])}
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
          {plusOneNames.length === 0 && (
            <p className="text-xs text-muted-foreground">No plus-ones added.</p>
          )}
          {plusOneNames.map((name, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                value={name}
                onChange={(e) =>
                  setPlusOneNames((prev) =>
                    prev.map((v, i) => (i === idx ? e.target.value : v))
                  )
                }
                placeholder={`Plus-one ${idx + 1} name`}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-destructive"
                onClick={() => setPlusOneNames((prev) => prev.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {enableDietaryPreference && (
        <div className="space-y-1">
          <Label>Dietary Preference</Label>
          <Input {...register("dietaryPreference")} placeholder="Vegetarian, Halal, etc." />
        </div>
      )}

      <div className="space-y-1">
        <Label>Internal Notes</Label>
        <Textarea {...register("internalNotes")} placeholder="Notes visible to admins only..." rows={2} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Guest" : "Add Guest"}
        </Button>
      </div>
    </form>
  );
}
