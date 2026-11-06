import type { BookingChannel, Prisma } from "@prisma/client";

// Internal identifiers and values already shown elsewhere on the page.
const HIDDEN_KEYS = new Set(["packageId", "packageSlug", "submittedAt", "currency", "title"]);

type CheckoutFlight = {
  offer?: { origin?: string; destination?: string; airline?: string; flightNumber?: string };
  query?: { tripType?: string; departureDate?: string; returnDate?: string; cabinClass?: string };
  passengers?: Array<{ firstName?: string; lastName?: string; type?: string }>;
};

function humanize(key: string) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatValue(value: Prisma.JsonValue): string {
  if (value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? Object.values(item).map((v) => formatValue(v as Prisma.JsonValue)).filter(Boolean).join(" · ")
          : formatValue(item),
      )
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${humanize(k)}: ${formatValue(v as Prisma.JsonValue)}`)
      .join(" · ");
  }
  return String(value);
}

function checkoutRows(flight: CheckoutFlight): Array<[string, string]> {
  const rows: Array<[string, string | undefined]> = [
    ["Route", flight.offer?.origin && flight.offer.destination ? `${flight.offer.origin} → ${flight.offer.destination}` : undefined],
    ["Airline", flight.offer?.airline],
    ["Flight number", flight.offer?.flightNumber],
    ["Trip type", flight.query?.tripType],
    ["Departure date", flight.query?.departureDate],
    ["Return date", flight.query?.returnDate],
    ["Cabin", flight.query?.cabinClass],
    [
      "Passengers",
      flight.passengers
        ?.map((p) => [p.firstName, p.lastName].filter(Boolean).join(" ") + (p.type ? ` (${p.type})` : ""))
        .join("\n"),
    ],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1]));
}

/** What the customer asked for, as label/value rows instead of raw JSON. */
export function BookingRequestDetails({
  channel,
  payload,
}: {
  channel: BookingChannel;
  payload: Prisma.JsonValue;
}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const rows =
    channel === "CHECKOUT"
      ? checkoutRows(payload as CheckoutFlight)
      : Object.entries(payload)
          .filter(([key]) => !HIDDEN_KEYS.has(key))
          .map(([key, value]): [string, string] => [humanize(key), formatValue(value ?? null)])
          .filter(([, value]) => value !== "");

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
          <dd className="mt-0.5 whitespace-pre-line break-words text-navy">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
