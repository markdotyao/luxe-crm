import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicContactForm } from "./public-contact-form";

export default async function PublicSignupPage({
  params,
}: {
  params: Promise<{ brand: string; store_id: string }>;
}) {
  const { brand: brandSlug, store_id: storeId } = await params;

  // UUID guard so a typo'd slug doesn't reach the DB as an obviously bad uuid.
  if (!UUID_RE.test(storeId)) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: brand }, { data: store }] = await Promise.all([
    supabase.from("brands").select("id, name, slug").eq("slug", brandSlug).maybeSingle(),
    supabase.from("stores").select("id, name").eq("id", storeId).maybeSingle(),
  ]);

  if (!brand || !store) {
    notFound();
  }

  return (
    <PublicContactForm
      brandSlug={brand.slug}
      brandName={brand.name}
      storeId={store.id}
      storeName={store.name}
    />
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
