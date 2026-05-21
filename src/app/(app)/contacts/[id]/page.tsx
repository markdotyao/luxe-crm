import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ContactDetailContent } from "@/components/contacts/contact-detail-content";
import { Button } from "@/components/ui/button";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/">
          <ArrowLeft />
          Back to contacts
        </Link>
      </Button>
      <ContactDetailContent id={id} />
    </div>
  );
}
