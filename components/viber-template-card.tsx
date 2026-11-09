"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_VIBER_MESSAGE_TEMPLATE, VIBER_TEMPLATE_PLACEHOLDERS } from "@/lib/viber";

export function ViberTemplateCard({
  eventId,
  initialTemplate,
}: {
  eventId: string;
  initialTemplate: string | null;
}) {
  const [template, setTemplate] = useState(initialTemplate ?? DEFAULT_VIBER_MESSAGE_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertPlaceholder(token: string) {
    const field = textareaRef.current;
    if (!field) {
      setTemplate((current) => `${current}${token}`);
      return;
    }
    const start = field.selectionStart ?? template.length;
    const end = field.selectionEnd ?? template.length;
    const next = `${template.slice(0, start)}${token}${template.slice(end)}`;
    setTemplate(next);
    requestAnimationFrame(() => {
      field.focus();
      const cursor = start + token.length;
      field.setSelectionRange(cursor, cursor);
    });
  }

  async function save(nextTemplate = template) {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/viber-template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: nextTemplate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save Viber message");
      setTemplate(data.template ?? DEFAULT_VIBER_MESSAGE_TEMPLATE);
      toast.success(data.template ? "Viber message saved" : "Viber message reset to the built-in invitation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Viber message");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Viber copy message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This is the full invitation copied when you send a Viber invite. Open Viber still inserts only a short draft, because Viber keeps 100 characters from a link.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {VIBER_TEMPLATE_PLACEHOLDERS.map((token) => (
            <Button key={token} type="button" size="sm" variant="outline" onClick={() => insertPlaceholder(token)}>
              {token}
            </Button>
          ))}
        </div>
        <Textarea
          ref={textareaRef}
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          rows={10}
          maxLength={2000}
          className="font-mono text-xs"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{template.length}/2000</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => save("")} disabled={saving}>
              Use built-in
            </Button>
            <Button type="button" onClick={() => save()} disabled={saving}>
              {saving ? "Saving..." : "Save Viber message"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
