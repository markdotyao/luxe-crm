"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

export function ContactDrawer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Let the slide-out animation finish before unmounting.
      window.setTimeout(() => router.back(), 200);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetTitle className="sr-only">Contact details</SheetTitle>
        <SheetDescription className="sr-only">
          Slide-out detail pane for the selected contact.
        </SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
