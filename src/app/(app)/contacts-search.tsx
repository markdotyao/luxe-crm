"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Suggestion = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
};

const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 8;

export function ContactsSearch({
  onSelect,
}: {
  onSelect: (contactId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounced backend search across name / phone / email / city.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      // Escape ilike wildcards in the user's input so they don't break the
      // pattern when typing literal % or _.
      const escaped = trimmed.replace(/[%_]/g, (m) => `\\${m}`);
      const pattern = `%${escaped}%`;

      const supabase = createClient();
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, phone, email, city")
        .or(
          [
            `first_name.ilike.${pattern}`,
            `last_name.ilike.${pattern}`,
            `phone.ilike.${pattern}`,
            `email.ilike.${pattern}`,
            `city.ilike.${pattern}`,
          ].join(","),
        )
        .order("last_name")
        .order("first_name")
        .limit(MAX_SUGGESTIONS);

      if (cancelled) return;
      setLoading(false);
      setSuggestions(data ?? []);
      setOpen(true);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function selectSuggestion(id: string) {
    onSelect(id);
    setOpen(false);
    setQuery("");
    setSuggestions([]);
  }

  const showDropdown = open && query.trim() !== "";

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search by name, phone, email, or city…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "Enter" && suggestions[0]) {
            e.preventDefault();
            selectSuggestion(suggestions[0].id);
          }
        }}
        className="pl-9 pr-9"
        aria-label="Search contacts"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setSuggestions([]);
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border bg-popover shadow-md">
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Searching…
            </p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No matches.
            </p>
          ) : (
            <ul role="listbox">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => selectSuggestion(c.id)}
                    className="block w-full px-3 py-2 text-left hover:bg-muted"
                  >
                    <span className="block text-sm font-medium">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[c.phone, c.email, c.city].filter(Boolean).join(" · ") ||
                        "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
