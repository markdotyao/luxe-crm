import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const c = data;
  const genderLabel = c.gender ? c.gender.replace(/_/g, " ") : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/">
          <ArrowLeft />
          Back to contacts
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <CardTitle className="text-2xl">
              {c.first_name} {c.last_name}
            </CardTitle>
            <CardDescription>
              Added {longDate.format(new Date(c.created_at))}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/contacts/${c.id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Phone" value={c.phone} />
            <DetailField label="Email" value={c.email} />
            <DetailField
              label="Date of birth"
              value={c.dob ? longDate.format(new Date(c.dob)) : null}
            />
            <DetailField label="Gender" value={genderLabel} capitalize />
            <DetailField label="City" value={c.city} />
          </dl>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Brand associations
        </h2>
        {c.contact_brands.length === 0 ? (
          <p className="text-sm text-muted-foreground">No brand links.</p>
        ) : (
          <div className="space-y-3">
            {c.contact_brands.map((cb) => (
              <Card key={cb.brand_id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {cb.brands?.name ?? "Unknown brand"}
                    </Badge>
                    {cb.stores?.name ? (
                      <span className="text-sm text-muted-foreground">
                        · {cb.stores.name}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {longDate.format(new Date(cb.created_at))}
                  </span>
                </CardHeader>
                {cb.notes ? (
                  <CardContent className="pt-0">
                    <p className="whitespace-pre-wrap text-sm">{cb.notes}</p>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailField({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string | null;
  capitalize?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          value
            ? capitalize
              ? "text-sm capitalize"
              : "text-sm"
            : "text-sm text-muted-foreground"
        }
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
