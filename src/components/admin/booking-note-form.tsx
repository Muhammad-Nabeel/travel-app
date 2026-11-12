"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";

/** Adds a note to the booking history without changing its status. */
export function BookingNoteForm({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to add note.");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Add a note (call made, documents received...)"
        className="w-full resize-y rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-xs text-deal">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !note.trim()}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add note"}
        </button>
      </div>
    </form>
  );
}
