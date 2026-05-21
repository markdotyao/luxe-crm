import { ContactDetailContent } from "@/components/contacts/contact-detail-content";
import { ContactDrawer } from "./contact-drawer";

export default async function InterceptedContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ContactDrawer>
      <ContactDetailContent id={id} />
    </ContactDrawer>
  );
}
