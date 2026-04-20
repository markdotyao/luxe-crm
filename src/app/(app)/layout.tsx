import { Toaster } from "sonner";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader userEmail={user.email ?? ""} />
      <main className="container py-6 md:py-10">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
