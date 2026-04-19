import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type ContactRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  created_at: string;
  contact_brands: {
    brand_id: string;
    notes: string | null;
    brands: { id: string; name: string } | null;
  }[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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
    .limit(100)
    .returns<ContactRow[]>();

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead>Brands</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.first_name} {c.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.city ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.contact_brands
                          .map((cb) => cb.brands)
                          .filter(
                            (b): b is { id: string; name: string } => b !== null,
                          )
                          .map((b) => (
                            <Badge key={b.id} variant="secondary">
                              {b.name}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {dateFormatter.format(new Date(c.created_at))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
