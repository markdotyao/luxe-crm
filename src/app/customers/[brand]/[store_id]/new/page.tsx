import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicContactForm } from "./public-contact-form";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // Single query against the join table — only returns a row if the
  // (brand, store) pair is actually associated. Removes the "Panerai form
  // hosted at a Hublot store" failure mode.
  const supabase = await createClient();
  const { data } = await supabase
    .from("brand_stores")
    .select("brands!inner ( id, name, slug ), stores!inner ( id, name )")
    .eq("brands.slug", brandSlug)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data?.brands || !data?.stores) {
    notFound();
  }

  return (
    <PublicContactForm
      brandSlug={data.brands.slug}
      brandName={data.brands.name}
      storeId={data.stores.id}
      storeName={data.stores.name}
    />
  );
}
