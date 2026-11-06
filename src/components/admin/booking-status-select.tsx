"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";

import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_TONES,
} from "@/lib/bookings/status";

/** Saves on change; reverts and shows the error if the update fails. */
export function BookingStatusSelect({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<BookingStatus>(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(next: BookingStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to update status.");
      router.refresh();
    } catch (err) {
      setValue(previous);
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <select
        aria-label="Booking status"
        value={value}
        disabled={saving}
        onChange={(e) => void handleChange(e.target.value as BookingStatus)}
        className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60 ${BOOKING_STATUS_TONES[value]}`}
      >
        {BOOKING_STATUSES.map((option) => (
          <option key={option} value={option}>
            {BOOKING_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-deal">{error}</span>}
    </span>
  );
}
