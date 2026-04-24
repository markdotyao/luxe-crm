import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader({
  userEmail,
  isAdmin,
}: {
  userEmail: string;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Luxe CRM
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/users"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Users
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {userEmail}
          </span>
          <form action="/logout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
