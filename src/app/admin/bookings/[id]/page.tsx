import Link from "next/link";
import { notFound } from "next/navigation";

import {
  markDatabaseUnavailable,
  prisma,
  shouldBypassDatabase,
} from "@/lib/db";

type FlightPayload = {
  offer?: {
    origin?: string;
    destination?: string;
    airline?: string;
    flightNumber?: string;
    departure?: string;
    arrival?: string;
    price?: number;
    currency?: string;
    refundable?: boolean;
    seatsAvailable?: number;
    validatingAirline?: string;
    passengerFares?: Array<{
      passengerType?: string;
      quantity?: number;
      baggage?: {
        pieces?: number;
        weight?: number;
        unit?: string;
      };
    }>;
    legs?: Array<{
      segments?: Array<{
        cabin?: string;
        bookingClass?: string;
        aircraft?: string;
      }>;
    }>;
  };
  query?: {
    tripType?: string;
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    adults?: number;
    children?: number;
    infants?: number;
    cabinClass?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  passengers?: Array<{
    firstName?: string;
    lastName?: string;
    type?: string;
    dateOfBirth?: string;
    passportExpiry?: string;
  }>;
};

type PaymentPayload = {
  method?: string;
  status?: string;
  serviceChargePercent?: number;
  serviceChargeAmount?: number;
  grandTotal?: number;
  requestedAt?: string;
  branch?: {
    id?: string;
    name?: string;
    city?: string;
    address?: string;
    phone?: string | null;
  } | null;
};

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status?: string | null) {
  if (!status) return "-";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(currency: string, amount: string) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) {
    return `${currency} ${amount}`;
  }

  return `${currency} ${parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function asFlightPayload(data: unknown): FlightPayload | null {
  if (!data || typeof data !== "object") return null;
  return data as FlightPayload;
}

function asPaymentPayload(data: unknown): PaymentPayload | null {
  if (!data || typeof data !== "object") return null;
  return data as PaymentPayload;
}

function getAmenityTags(flight: FlightPayload | null): string[] {
  if (!flight) return [];

  const tags = new Set<string>();
  const offer = flight.offer;
  const firstSegment = offer?.legs?.[0]?.segments?.[0];
  const baggage = offer?.passengerFares?.[0]?.baggage;

  if (offer?.refundable === true) tags.add("Refundable fare");
  if (offer?.refundable === false) tags.add("Non-refundable fare");
  if (offer?.seatsAvailable)
    tags.add(`${offer.seatsAvailable} seats available`);
  if (firstSegment?.cabin) tags.add(`${firstSegment.cabin} cabin`);
  if (firstSegment?.bookingClass)
    tags.add(`Booking class ${firstSegment.bookingClass}`);
  if (firstSegment?.aircraft) tags.add(`Aircraft ${firstSegment.aircraft}`);
  if (baggage?.pieces) tags.add(`${baggage.pieces}pc baggage`);
  if (baggage?.weight && baggage?.unit)
    tags.add(`${baggage.weight}${baggage.unit} baggage`);

  return Array.from(tags);
}

export default async function AdminBookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await getBookingById(id);
  if (!booking) {
    notFound();
  }

  if (booking.channel === "SERVICE_REQUEST") {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-6">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Service Request Details
            </p>
            <Link
              href="/admin/bookings"
              className="rounded-lg border border-line bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft"
            >
              Back To List
            </Link>
          </div>

          <h1 className="text-xl font-semibold text-navy">
            {booking.reference}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Type: {formatStatus(booking.type)} · Status:{" "}
            {formatStatus(booking.status)}
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Basic
            </p>
            <div className="mt-2 space-y-1 text-sm text-navy/80">
              <p>
                <span className="font-semibold text-navy">Amount:</span>{" "}
                {formatMoney(
                  booking.currency,
                  booking.totalAmount?.toString() ?? "0",
                )}
              </p>
              <p>
                <span className="font-semibold text-navy">Customer:</span>{" "}
                {booking.customerName ?? "N/A"} (
                {booking.customerEmail ?? "N/A"})
              </p>
              <p>
                <span className="font-semibold text-navy">Phone:</span>{" "}
                {booking.customerPhone ?? "N/A"}
              </p>
              <p>
                <span className="font-semibold text-navy">Title:</span>{" "}
                {booking.title ?? "N/A"}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Timeline
            </p>
            <div className="mt-2 space-y-1 text-sm text-navy/80">
              <p>
                <span className="font-semibold text-navy">Created:</span>{" "}
                {formatDateTime(booking.createdAt)}
              </p>
              <p>
                <span className="font-semibold text-navy">Updated:</span>{" "}
                {formatDateTime(booking.updatedAt)}
              </p>
            </div>
          </article>
        </section>

        <details className="rounded-2xl border border-line bg-subtle p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy">
            Request Payload (JSON)
          </summary>
          <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-navy p-3 text-xs text-white/90">
            {JSON.stringify(booking.payload, null, 2)}
          </pre>
        </details>
      </main>
    );
  }

  const flight = asFlightPayload(booking.payload);
  const payment = asPaymentPayload(booking.paymentData);
  const amenities = getAmenityTags(flight);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Booking Details
          </p>
          <Link
            href="/admin/bookings"
            className="rounded-lg border border-line bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft"
          >
            Back To List
          </Link>
        </div>

        <h1 className="text-xl font-semibold text-navy">
          {booking.reference}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Provider: {booking.provider ?? "-"} · Status: {formatStatus(booking.status)}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Basic
          </p>
          <div className="mt-2 space-y-1 text-sm text-navy/80">
            <p>
              <span className="font-semibold text-navy">Amount:</span>{" "}
              {formatMoney(booking.currency, booking.totalAmount?.toString() ?? "0")}
            </p>
            <p>
              <span className="font-semibold text-navy">Created:</span>{" "}
              {formatDateTime(booking.createdAt)}
            </p>
            <p>
              <span className="font-semibold text-navy">Updated:</span>{" "}
              {formatDateTime(booking.updatedAt)}
            </p>
            <p>
              <span className="font-semibold text-navy">Customer:</span>{" "}
              {booking.customerName ?? "N/A"} ({booking.customerEmail ?? "N/A"})
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Payment
          </p>
          <div className="mt-2 space-y-1 text-sm text-navy/80">
            <p>
              <span className="font-semibold text-navy">Method:</span>{" "}
              {formatStatus(payment?.method)}
            </p>
            <p>
              <span className="font-semibold text-navy">
                Payment Status:
              </span>{" "}
              {formatStatus(payment?.status)}
            </p>
            <p>
              <span className="font-semibold text-navy">
                Service Charge:
              </span>{" "}
              {payment?.serviceChargePercent ?? 0}% ·{" "}
              {payment?.serviceChargeAmount ?? 0}
            </p>
            <p>
              <span className="font-semibold text-navy">Grand Total:</span>{" "}
              {(payment?.grandTotal ?? booking.totalAmount ?? 0).toString()}
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Selected Flight (Sabre/Provider Offer)
        </p>

        {flight ? (
          <>
            <div className="mt-3 grid gap-2 text-sm text-navy/80 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-navy">Route:</span>{" "}
                {flight.offer?.origin ?? flight.query?.origin ?? "-"} to{" "}
                {flight.offer?.destination ?? flight.query?.destination ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-navy">Airline:</span>{" "}
                {flight.offer?.airline ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-navy">Flight #:</span>{" "}
                {flight.offer?.flightNumber ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-navy">Trip Type:</span>{" "}
                {formatStatus(flight.query?.tripType)}
              </p>
              <p>
                <span className="font-semibold text-navy">
                  Departure Date:
                </span>{" "}
                {formatDate(flight.query?.departureDate)}
              </p>
              <p>
                <span className="font-semibold text-navy">
                  Return Date:
                </span>{" "}
                {formatDate(flight.query?.returnDate)}
              </p>
              <p>
                <span className="font-semibold text-navy">
                  Refundable:
                </span>{" "}
                {flight.offer?.refundable === undefined
                  ? "-"
                  : flight.offer.refundable
                    ? "Yes"
                    : "No"}
              </p>
              <p>
                <span className="font-semibold text-navy">
                  Validating Airline:
                </span>{" "}
                {flight.offer?.validatingAirline ?? "-"}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-line bg-subtle p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Amenities & Fare Features
              </p>
              {amenities.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {amenities.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  No amenities/refund metadata found in this booking payload.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-line bg-subtle p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Passenger Details
              </p>
              {Array.isArray(flight.passengers) &&
              flight.passengers.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-navy/80">
                  {flight.passengers.map((passenger, index) => (
                    <li key={`${booking.id}-passenger-${index}`}>
                      {passenger.firstName ?? ""} {passenger.lastName ?? ""}
                      {" · "}
                      {passenger.type ?? "-"}
                      {passenger.dateOfBirth
                        ? ` · DOB ${passenger.dateOfBirth}`
                        : ""}
                      {passenger.passportExpiry
                        ? ` · Passport Exp ${passenger.passportExpiry}`
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  No passenger list found.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No flight data found for this booking.
          </p>
        )}
      </section>

      <details className="rounded-2xl border border-line bg-subtle p-4">
        <summary className="cursor-pointer text-sm font-semibold text-navy">
          Raw Payload (JSON)
        </summary>
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-navy p-3 text-xs text-white/90">
          {JSON.stringify(
            {
              payload: booking.payload,
              paymentData: booking.paymentData,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </main>
  );
}

async function getBookingById(id: string) {
  if (shouldBypassDatabase()) {
    return null;
  }

  try {
    return await prisma.booking.findUnique({ where: { id } });
  } catch (err) {
    markDatabaseUnavailable(err);
    return null;
  }
}
