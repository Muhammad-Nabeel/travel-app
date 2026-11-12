import type { BookingStatus } from "@prisma/client";

import { BookingNoteForm } from "@/components/admin/booking-note-form";
import { BOOKING_STATUS_LABELS } from "@/lib/bookings/status";

export type BookingHistoryEvent = {
  id: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus | null;
  note: string | null;
  actorName: string;
  createdAt: Date;
};

function formatWhen(value: Date) {
  return value.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  });
}

function describe(event: BookingHistoryEvent) {
  if (event.fromStatus && event.toStatus && event.fromStatus !== event.toStatus) {
    return `${BOOKING_STATUS_LABELS[event.fromStatus]} → ${BOOKING_STATUS_LABELS[event.toStatus]}`;
  }
  return "Note added";
}

/** Who changed the booking and when, newest first (BookingEvent rows). */
export function BookingHistory({
  bookingId,
  status,
  createdAt,
  events,
}: {
  bookingId: string;
  status: BookingStatus;
  createdAt: Date;
  events: BookingHistoryEvent[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">History</p>
      <BookingNoteForm bookingId={bookingId} status={status} />
      <ol className="mt-3 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="border-l-2 border-line pl-3 text-sm">
            <p className="font-medium text-navy">{describe(event)}</p>
            <p className="text-xs text-muted">
              {event.actorName} · {formatWhen(event.createdAt)} (PKT)
            </p>
            {event.note ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy/80">{event.note}</p>
            ) : null}
          </li>
        ))}
        <li className="border-l-2 border-line pl-3 text-sm">
          <p className="font-medium text-navy">Booking received</p>
          <p className="text-xs text-muted">{formatWhen(createdAt)} (PKT)</p>
        </li>
      </ol>
    </section>
  );
}
