import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EventNav } from "@/components/event-nav";
import { TemplatesClient } from "@/components/templates-client";
import { ViberTemplateCard } from "@/components/viber-template-card";
import { DefaultTemplatesClient } from "@/components/default-templates-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplatesPage({ params }: PageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const templates = await prisma.emailTemplate.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = templates.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-0">
      <EventNav eventId={id} />
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Email Templates</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>

        <ViberTemplateCard eventId={id} initialTemplate={event.viberMessageTemplate} />

        <Tabs defaultValue="defaults" className="w-full">
          <TabsList>
            <TabsTrigger value="defaults">Default Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Templates {serialized.length > 0 ? `(${serialized.length})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="defaults" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-sm text-blue-900">Getting Started</h3>
              <p className="text-sm text-blue-800 mt-1">
                Start with our pre-built email templates. Edit them to match your event's tone and branding, then save to create custom versions.
              </p>
            </div>
            <DefaultTemplatesClient eventId={id} />
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <TemplatesClient eventId={id} initialTemplates={serialized} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
