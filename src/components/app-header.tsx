"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppHeader({
  userEmail,
  isAdmin,
}: {
  userEmail: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const isContactsActive =
    pathname === "/" || pathname.startsWith("/contacts");
  const isInterestActive = pathname.startsWith("/interest");
  const isUsersActive = pathname.startsWith("/admin/users");
  const isIntakeActive = pathname.startsWith("/admin/intake");

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Luxe CRM
          </Link>
          <NavLink href="/" active={isContactsActive}>
            Contacts
          </NavLink>
          <NavLink href="/interest" active={isInterestActive}>
            Interest List
          </NavLink>
          {isAdmin ? (
            <>
              <NavLink href="/admin/users" active={isUsersActive}>
                Users
              </NavLink>
              <NavLink href="/admin/intake" active={isIntakeActive}>
                Intake Forms
              </NavLink>
            </>
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

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors",
        active
          ? "font-bold text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
