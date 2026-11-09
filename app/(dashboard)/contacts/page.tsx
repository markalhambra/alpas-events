import { prisma } from "@/lib/prisma";
import { ContactsClient } from "@/components/contacts-client";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Saved people you can add to any event guest list.
        </p>
      </div>
      <ContactsClient initialContacts={contacts} />
    </div>
  );
}
