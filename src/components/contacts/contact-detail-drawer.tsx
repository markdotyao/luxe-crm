"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import {
  type ContactDetailData,
  ContactDetailSkeleton,
  ContactDetailView,
} from "./contact-detail-view";

export function ContactDetailDrawer({
  contactId,
  onOpenChange,
}: {
  contactId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = contactId !== null;
  const [data, setData] = useState<ContactDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId) return;
    let cancelled = false;
    setData(null);
    setError(null);

    const supabase = createClient();
    supabase
      .from("contacts")
      .select(
        `
        id, first_name, last_name, dob, gender, phone, email, city, created_at,
        contact_brands (
          brand_id, notes, store_id, created_at,
          brands ( id, name ),
          stores ( id, name )
        )
        `,
      )
      .eq("id", contactId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setError(error?.message ?? "Contact not found.");
          return;
        }
        setData(data);
      });
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="sr-only">Contact details</SheetTitle>
        <SheetDescription className="sr-only">
          Slide-out detail pane for the selected contact.
        </SheetDescription>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : data ? (
          <ContactDetailView data={data} />
        ) : (
          <ContactDetailSkeleton />
        )}
      </SheetContent>
    </Sheet>
  );
}
