import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContactDetailView } from "./contact-detail-view";

export async function ContactDetailContent({ id }: { id: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return <ContactDetailView data={data} />;
}
