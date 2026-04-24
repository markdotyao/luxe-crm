import { Toaster } from "sonner";
import { AppHeader } from "@/components/app-header";
import { getProfile, requireUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        userEmail={user.email ?? ""}
        isAdmin={profile?.role === "admin"}
      />
      <main className="container py-6 md:py-10">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
