"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContactDetailDrawer } from "@/components/contacts/contact-detail-drawer";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type Contact = {
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

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden md:table-cell">City</TableHead>
            <TableHead>Brands</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpenId(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(c.id);
                }
              }}
              className="cursor-pointer focus:bg-muted/50 focus:outline-none"
            >
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
                    .filter((b): b is { id: string; name: string } => b !== null)
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

      <ContactDetailDrawer
        contactId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </>
  );
}
