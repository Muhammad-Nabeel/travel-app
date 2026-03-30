"use client";

import { useEffect, useRef, useState } from "react";

export type Airport = {
  iata: string;
  city: string;
  name: string;
  country: string;
};

interface AirportInputProps {
  value: string;
  onSelect: (airport: Airport) => void;
  onChange: (raw: string) => void;
  placeholder?: string;
  required?: boolean;
  inputClassName?: string;
}

export function AirportInput({
  value,
  onSelect,
  onChange,
  placeholder,
  required,
  inputClassName,
}: AirportInputProps) {
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleChange(raw: string) {
    onChange(raw);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (raw.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    timerRef.current = setTimeout(() => {
      void fetch(`/api/places/airports?query=${encodeURIComponent(raw.trim())}`)
        .then((r) => r.json())
        .then((json: { results?: Airport[] }) => {
          setSuggestions(json.results ?? []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 280);
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", flex: 1, minWidth: 0 }}
    >
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        spellCheck={false}
      />

      {open && (loading || suggestions.length > 0) && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
            zIndex: 400,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "12px 16px",
                fontSize: "0.875rem",
                color: "#9ca3af",
              }}
            >
              Searching airports...
            </div>
          ) : (
            suggestions.map((airport, idx) => (
              <button
                key={airport.iata}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(airport);
                  setOpen(false);
                  setSuggestions([]);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 14px",
                  border: "none",
                  borderBottom:
                    idx < suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#111827",
                  }}
                >
                  {airport.city}{" "}
                  <span style={{ color: "#2563eb" }}>({airport.iata})</span>
                </div>
                <div
                  style={{
                    fontSize: "0.73rem",
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {airport.name} · {airport.country}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
