import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ContactsTable } from "./contacts-table";

export default async function ContactsPage() {
  const profile = await getProfile();

  // Non-admin without a brand assignment: empty, actionable message.
  if (profile && profile.role !== "admin" && !profile.brand_id) {
    return (
      <EmptyState
        icon={Users}
        title="Your account isn't assigned to a brand yet"
        description="Contact your administrator to get set up. Once you're assigned, your brand's contacts will appear here."
      />
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(
      `
      id, first_name, last_name, phone, email, city, created_at,
      contact_brands ( brand_id, notes, brands ( id, name ) )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <EmptyState
        title="Couldn't load contacts"
        description={error.message}
      />
    );
  }

  const contacts = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length === 0
              ? "No contacts yet."
              : `${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/contacts/new">
            <Plus />
            New contact
          </Link>
        </Button>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to get started."
          action={
            <Button asChild size="sm">
              <Link href="/contacts/new">
                <Plus />
                New contact
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader className="sr-only">
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ContactsTable contacts={contacts} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
