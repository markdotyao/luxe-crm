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
import { createClient } from "@/lib/supabase/server";
import { InviteUserForm } from "./invite-user-form";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  brand_manager: "Brand manager",
  sales_staff: "Sales staff",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [usersResult, brandsResult, storesResult] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("stores").select("id, name").order("name"),
  ]);

  const brands = brandsResult.data ?? [];
  const stores = storesResult.data ?? [];

  if (usersResult.error) {
    return (
      <EmptyState
        title="Couldn't load users"
        description={usersResult.error.message}
      />
    );
  }

  const users = usersResult.data ?? [];
  const brandName = (id: string | null) =>
    id ? brands.find((b) => b.id === id)?.name ?? "—" : "—";
  const storeName = (id: string | null) =>
    id ? stores.find((s) => s.id === id)?.name ?? "—" : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Invite staff and assign them to a brand and store.
        </p>
      </div>

      <InviteUserForm brands={brands} stores={stores} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {users.length} {users.length === 1 ? "user" : "users"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="hidden md:table-cell">Store</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "admin" ? "default" : "secondary"}
                    >
                      {ROLE_LABEL[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{brandName(u.brand_id)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {storeName(u.store_id)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {dateFormatter.format(new Date(u.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/users/${u.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
