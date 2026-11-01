"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

import { getActivityHref } from "@/lib/activity-href";

const MAX_SUGGESTIONS = 8;

export type ActivitySuggestion = {
  id: string;
  slug: string | null;
  title: string;
  category: string;
  location: string;
};

type ActivitySearchInputProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  suggestions: ActivitySuggestion[];
};

function matchesQuery(item: ActivitySuggestion, query: string) {
  return (
    item.title.toLowerCase().includes(query) ||
    item.location.toLowerCase().includes(query) ||
    item.category.split("-").join(" ").toLowerCase().includes(query)
  );
}

// Splits the title so the typed part can be emphasised in the dropdown.
function highlight(title: string, query: string) {
  const index = query ? title.toLowerCase().indexOf(query) : -1;
  if (index === -1) return title;
  return (
    <>
      {title.slice(0, index)}
      <mark className="bg-transparent text-brand">
        {title.slice(index, index + query.length)}
      </mark>
      {title.slice(index + query.length)}
    </>
  );
}

export function ActivitySearchInput({
  name,
  defaultValue = "",
  placeholder,
  className,
  suggestions,
}: ActivitySearchInputProps) {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim().toLowerCase();
  const results = useMemo(
    () =>
      (query
        ? suggestions.filter((item) => matchesQuery(item, query))
        : suggestions
      ).slice(0, MAX_SUGGESTIONS),
    [query, suggestions],
  );

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function choose(item: ActivitySuggestion) {
    setValue(item.title);
    setOpen(false);
    router.push(getActivityHref(item));
  }

  const showList = open && suggestions.length > 0;

  return (
    // Not positioned: the dropdown anchors to the enclosing field so it spans
    // the whole search card field rather than just the text input.
    <div ref={containerRef} className="min-w-0 flex-1">
      <input
        type="search"
        name={name}
        value={value}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && activeIndex >= 0
            ? `${listId}-${activeIndex}`
            : undefined
        }
        onChange={(e) => {
          setValue(e.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
          } else if (e.key === "Enter" && showList && activeIndex >= 0) {
            // Otherwise Enter falls through and submits the search form.
            e.preventDefault();
            choose(results[activeIndex]);
          }
        }}
      />

      {showList && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 min-w-72 overflow-hidden rounded-xl border border-line bg-white shadow-raised"
        >
          <p className="border-b border-line px-4 py-2 text-xs font-medium text-muted">
            {query ? "Matching activities" : "Popular activities"}
          </p>
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">
              No activities match &ldquo;{value.trim()}&rdquo;. Try a city or
              activity name.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((item, idx) => (
                <li
                  key={item.id}
                  id={`${listId}-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(item);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${
                    idx === activeIndex ? "bg-brand/5" : ""
                  }`}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {highlight(item.title, query)}
                    </span>
                    <span className="block truncate text-xs capitalize text-muted">
                      {item.location} · {item.category.split("-").join(" ")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
