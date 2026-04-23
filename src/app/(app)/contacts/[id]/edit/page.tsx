import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditContactForm } from "./edit-contact-form";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, dob, gender, phone, email, city")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return <EditContactForm contact={data} />;
}
