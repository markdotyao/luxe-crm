import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [usersResult, brandsResult, storesResult] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("stores").select("id, name").order("name"),
  ]);

  const user = usersResult.data?.find((u) => u.id === id);
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/admin/users">
            <ArrowLeft />
            Back to users
          </Link>
        </Button>
      </div>

      <EditUserForm
        user={user}
        brands={brandsResult.data ?? []}
        stores={storesResult.data ?? []}
      />
    </div>
  );
}
