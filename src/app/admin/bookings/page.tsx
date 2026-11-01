import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  Building2,
  Landmark,
  MapPinned,
  Plane,
  ShieldCheck,
} from "lucide-react";

import { getStoredBrandSettings } from "@/lib/admin-settings/brand-settings";
import type { BrandAssets, BrandAssetSlot } from "@/lib/brand-assets";
import {
  markDatabaseUnavailable,
  prisma,
  shouldBypassDatabase,
} from "@/lib/db";

type BookingListItem = {
  id: string;
  reference: string;
  type: "Flight" | "Hotel" | "Umrah" | "Visa" | "Tour";
  status: string;
  provider: string;
  totalAmount: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  isChatbotRequest: boolean;
  createdAtISO: string;
  createdDate: string;
  createdTime: string;
};

type BookingFilters = {
  reference: string;
  customer: string;
  status: string;
  provider: string;
  paymentMethod: string;
  type: string;
  chatbot: string;
  createdFrom: string;
  createdTo: string;
};

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "CANCELLED", "FAILED"];
const PROVIDER_OPTIONS = ["SABRE", "AMADEUS", "INTERNAL"];
const PAYMENT_OPTIONS = [
  "cash_on_delivery",
  "pay_at_branch",
  "wise",
  "stripe",
  "paypal",
  "sumup",
  "paymob",
];
const TYPE_OPTIONS = ["flight", "hotel", "umrah", "visa", "tour"];

function formatBookingType(type: string): BookingListItem["type"] {
  if (type === "FLIGHT") return "Flight";
  if (type === "HOTEL") return "Hotel";
  if (type === "UMRAH") return "Umrah";
  if (type === "VISA") return "Visa";
  return "Tour";
}

function mapFilterTypeToBookingType(type: string) {
  if (type === "flight") return "FLIGHT";
  if (type === "hotel") return "HOTEL";
  if (type === "umrah") return "UMRAH";
  if (type === "visa") return "VISA";
  if (type === "tour") return "TOUR";
  return "";
}

function formatDateTimeParts(value: string) {
  const parsed = new Date(value);

  return {
    date: parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    }),
    time: parsed.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function formatStatus(status: string) {
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

const TYPE_ASSET_SLOT: Record<BookingListItem["type"], BrandAssetSlot> = {
  Flight: "flights",
  Hotel: "hotels",
  Umrah: "umrah",
  Visa: "visa",
  Tour: "tours",
};

/** The type's icon from Admin → Media → Brand & Icons, else the built-in one. */
function TypeIcon({
  type,
  assets,
}: {
  type: BookingListItem["type"];
  assets: BrandAssets;
}) {
  const uploaded = assets[TYPE_ASSET_SLOT[type]];
  if (uploaded) {
    return (
      <Image
        src={uploaded}
        alt=""
        width={20}
        height={20}
        className="size-5 object-contain"
      />
    );
  }

  if (type === "Flight") return <Plane className="h-4 w-4" />;
  if (type === "Hotel") return <Building2 className="h-4 w-4" />;
  if (type === "Umrah") return <Landmark className="h-4 w-4" />;
  if (type === "Visa") return <ShieldCheck className="h-4 w-4" />;
  return <MapPinned className="h-4 w-4" />;
}

function getTypeBadgeClasses(type: BookingListItem["type"]) {
  if (type === "Flight") {
    return "bg-brand-soft text-brand-strong ring-1 ring-brand/20";
  }

  if (type === "Hotel") {
    return "bg-gold/15 text-gold-strong ring-1 ring-gold/30";
  }

  if (type === "Umrah") {
    return "bg-success/12 text-success ring-1 ring-success/25";
  }

  if (type === "Visa") {
    return "bg-navy/8 text-navy ring-1 ring-navy/15";
  }

  return "bg-subtle text-navy ring-1 ring-line-strong";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseBookingFilters(resolvedSearchParams);
  const [bookings, brand] = await Promise.all([
    getBookings(filters),
    getStoredBrandSettings(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-navy">All Bookings</h1>
        <p className="mt-1 text-sm text-muted">
          Filter bookings below and click View for full details.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Reference
            </span>
            <input
              name="reference"
              defaultValue={filters.reference}
              placeholder="FL-..."
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Customer
            </span>
            <input
              name="customer"
              defaultValue={filters.customer}
              placeholder="Name or email"
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Status
            </span>
            <select
              name="status"
              defaultValue={filters.status}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Provider
            </span>
            <select
              name="provider"
              defaultValue={filters.provider}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Payment Method
            </span>
            <select
              name="paymentMethod"
              defaultValue={filters.paymentMethod}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Type
            </span>
            <select
              name="type"
              defaultValue={filters.type}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Chatbot Requests
            </span>
            <select
              name="chatbot"
              defaultValue={filters.chatbot}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">All</option>
              <option value="yes">Chatbot only</option>
              <option value="no">Exclude chatbot</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Created From
            </span>
            <input
              type="date"
              name="createdFrom"
              defaultValue={filters.createdFrom}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Created To
            </span>
            <input
              type="date"
              name="createdTo"
              defaultValue={filters.createdTo}
              className="rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>

          <div className="flex items-end gap-2 xl:justify-end">
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Apply Filters
            </button>
            <Link
              href="/admin/bookings"
              className="rounded-lg border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-navy/80 transition hover:bg-subtle"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-white shadow-card">
        {bookings.length === 0 ? (
          <article className="p-6">
            <p className="text-sm text-muted">No bookings found.</p>
          </article>
        ) : (
          <div className="max-h-[68vh] overflow-y-auto overscroll-contain">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="sticky top-0 z-10 bg-subtle shadow-[0_1px_0_0_rgb(226,232,240)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">
                        {booking.reference}
                      </p>
                      {booking.isChatbotRequest ? (
                        <span className="mt-1 inline-flex rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-semibold text-success">
                          Chatbot
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-navy/80">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${getTypeBadgeClasses(booking.type)}`}
                        title={booking.type}
                        aria-label={booking.type}
                      >
                        <TypeIcon type={booking.type} assets={brand.assets} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-navy">{booking.customerName}</p>
                      <p className="text-xs text-muted">
                        {booking.customerEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-navy/80">
                      {booking.paymentMethod}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">
                      {formatMoney(booking.currency, booking.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-line/50 px-2.5 py-1 text-xs font-semibold text-navy/80">
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/80">
                      <p className="font-medium text-navy">
                        {booking.createdDate}
                      </p>
                      <p className="text-xs text-muted">
                        {booking.createdTime}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="rounded-lg border border-line bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong transition hover:bg-brand-soft"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function parseFilterValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseBookingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): BookingFilters {
  return {
    reference: parseFilterValue(searchParams.reference).trim(),
    customer: parseFilterValue(searchParams.customer).trim(),
    status: parseFilterValue(searchParams.status).trim().toUpperCase(),
    provider: parseFilterValue(searchParams.provider).trim().toUpperCase(),
    paymentMethod: parseFilterValue(searchParams.paymentMethod)
      .trim()
      .toLowerCase(),
    type: parseFilterValue(searchParams.type).trim().toLowerCase(),
    chatbot: parseFilterValue(searchParams.chatbot).trim().toLowerCase(),
    createdFrom: parseFilterValue(searchParams.createdFrom).trim(),
    createdTo: parseFilterValue(searchParams.createdTo).trim(),
  };
}

async function getBookings(
  filters: BookingFilters,
): Promise<BookingListItem[]> {
  if (shouldBypassDatabase()) {
    return [];
  }

  try {
    const where: Prisma.BookingWhereInput = {};

    if (filters.reference) {
      where.reference = { contains: filters.reference };
    }

    if (filters.status && STATUS_OPTIONS.includes(filters.status)) {
      where.status = filters.status as never;
    }

    if (filters.provider && PROVIDER_OPTIONS.includes(filters.provider)) {
      where.provider = filters.provider as never;
    }

    if (filters.customer) {
      where.OR = [
        { customerName: { contains: filters.customer } },
        { customerEmail: { contains: filters.customer } },
      ];
    }

    if (filters.chatbot === "yes") {
      where.channel = "CHATBOT";
    }

    if (filters.chatbot === "no") {
      where.channel = { not: "CHATBOT" };
    }

    if (filters.paymentMethod) {
      where.paymentData = { path: ["method"], equals: filters.paymentMethod };
    }

    if (filters.createdFrom || filters.createdTo) {
      const createdAtFilter: Prisma.DateTimeFilter = {};

      if (filters.createdFrom) {
        createdAtFilter.gte = new Date(`${filters.createdFrom}T00:00:00.000Z`);
      }

      if (filters.createdTo) {
        createdAtFilter.lte = new Date(`${filters.createdTo}T23:59:59.999Z`);
      }

      where.createdAt = createdAtFilter;
    }

    const bookingType = mapFilterTypeToBookingType(filters.type);
    if (bookingType) {
      where.type = bookingType as never;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return bookings.map((booking) => {
      const paymentMethod =
        booking.paymentData && typeof booking.paymentData === "object"
          ? String((booking.paymentData as { method?: string }).method ?? "N/A")
          : "N/A";
      const createdAtParts = formatDateTimeParts(
        booking.createdAt.toISOString(),
      );

      return {
        id: booking.id,
        reference: booking.reference,
        type: formatBookingType(booking.type),
        status: booking.status,
        provider: booking.provider ?? "SERVICE",
        totalAmount: booking.totalAmount?.toString() ?? "0",
        currency: booking.currency,
        customerName: booking.customerName ?? "N/A",
        customerEmail: booking.customerEmail ?? "N/A",
        paymentMethod: formatStatus(paymentMethod),
        isChatbotRequest: booking.channel === "CHATBOT",
        createdAtISO: booking.createdAt.toISOString(),
        createdDate: createdAtParts.date,
        createdTime: createdAtParts.time,
      };
    });
  } catch (err) {
    markDatabaseUnavailable(err);
    return [];
  }
}
