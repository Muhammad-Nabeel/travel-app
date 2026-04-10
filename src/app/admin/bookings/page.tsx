import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  Building2,
  Landmark,
  MapPinned,
  Plane,
  ShieldCheck,
} from "lucide-react";

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

function detectTypeFromPayload(raw: unknown): BookingListItem["type"] | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const text = JSON.stringify(raw).toLowerCase();

  if (
    text.includes("umrah") ||
    text.includes("madinah") ||
    text.includes("makkah")
  ) {
    return "Umrah";
  }

  if (text.includes("visa")) {
    return "Visa";
  }

  if (
    text.includes("tour") ||
    text.includes("destination") ||
    text.includes("activity")
  ) {
    return "Tour";
  }

  return null;
}

function inferBookingType(params: {
  flightData: unknown;
  hotelData: unknown;
  paymentData: unknown;
}): BookingListItem["type"] {
  const { flightData, hotelData, paymentData } = params;

  const fromPayment = detectTypeFromPayload(paymentData);
  if (fromPayment) return fromPayment;

  const fromFlight = detectTypeFromPayload(flightData);
  if (fromFlight && fromFlight !== "Tour") return fromFlight;

  const fromHotel = detectTypeFromPayload(hotelData);
  if (fromHotel) return fromHotel;

  if (flightData) return "Flight";
  if (hotelData) return "Hotel";

  return "Tour";
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

function TypeIcon({ type }: { type: BookingListItem["type"] }) {
  if (type === "Flight") return <Plane className="h-4 w-4" />;
  if (type === "Hotel") return <Building2 className="h-4 w-4" />;
  if (type === "Umrah") return <Landmark className="h-4 w-4" />;
  if (type === "Visa") return <ShieldCheck className="h-4 w-4" />;
  return <MapPinned className="h-4 w-4" />;
}

function getTypeBadgeClasses(type: BookingListItem["type"]) {
  if (type === "Flight") {
    return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
  }

  if (type === "Hotel") {
    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  if (type === "Umrah") {
    return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (type === "Visa") {
    return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
  }

  return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseBookingFilters(resolvedSearchParams);
  const bookings = await getBookings(filters);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950 sm:text-3xl">
          All Bookings
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800/80 sm:text-base">
          Basic booking list is shown here. Click View to open full details like
          selected Sabre flight info, refundable status, and amenities.
        </p>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
        <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reference
            </span>
            <input
              name="reference"
              defaultValue={filters.reference}
              placeholder="FL-..."
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Customer
            </span>
            <input
              name="customer"
              defaultValue={filters.customer}
              placeholder="Name or email"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              name="status"
              defaultValue={filters.status}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Provider
            </span>
            <select
              name="provider"
              defaultValue={filters.provider}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment Method
            </span>
            <select
              name="paymentMethod"
              defaultValue={filters.paymentMethod}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </span>
            <select
              name="type"
              defaultValue={filters.type}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Chatbot Requests
            </span>
            <select
              name="chatbot"
              defaultValue={filters.chatbot}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="yes">Chatbot only</option>
              <option value="no">Exclude chatbot</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Created From
            </span>
            <input
              type="date"
              name="createdFrom"
              defaultValue={filters.createdFrom}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Created To
            </span>
            <input
              type="date"
              name="createdTo"
              defaultValue={filters.createdTo}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <div className="flex items-end gap-2 xl:justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <Link
              href="/admin/bookings"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-white shadow-sm">
        {bookings.length === 0 ? (
          <article className="p-6">
            <p className="text-sm text-slate-500">No bookings found.</p>
          </article>
        ) : (
          <div className="max-h-[68vh] overflow-y-auto overscroll-contain">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgb(226,232,240)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">
                        {booking.reference}
                      </p>
                      {booking.isChatbotRequest ? (
                        <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Chatbot
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${getTypeBadgeClasses(booking.type)}`}
                        title={booking.type}
                        aria-label={booking.type}
                      >
                        <TypeIcon type={booking.type} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{booking.customerName}</p>
                      <p className="text-xs text-slate-500">
                        {booking.customerEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {booking.paymentMethod}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatMoney(booking.currency, booking.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p className="font-medium text-slate-800">
                        {booking.createdDate}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.createdTime}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
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
      where.user = {
        OR: [
          { name: { contains: filters.customer } },
          { email: { contains: filters.customer } },
        ],
      };
    }

    if (filters.chatbot === "yes") {
      where.isChatbotRequest = true;
    }

    if (filters.chatbot === "no") {
      where.isChatbotRequest = false;
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

    const bookings = (await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      take: 200,
    })) as Array<{
      id: string;
      reference: string;
      status: string;
      provider: string;
      totalAmount: { toString: () => string };
      currency: string;
      flightData: unknown;
      hotelData: unknown;
      paymentData: unknown;
      isChatbotRequest: boolean;
      createdAt: Date;
      user: {
        name: string;
        email: string;
      };
    }>;

    const mapped: BookingListItem[] = bookings.map((booking) => {
      const type = inferBookingType({
        flightData: booking.flightData,
        hotelData: booking.hotelData,
        paymentData: booking.paymentData,
      });
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
        type,
        status: booking.status,
        provider: booking.provider,
        totalAmount: booking.totalAmount.toString(),
        currency: booking.currency,
        customerName: booking.user.name,
        customerEmail: booking.user.email,
        paymentMethod: formatStatus(paymentMethod),
        isChatbotRequest: booking.isChatbotRequest,
        createdDate: createdAtParts.date,
        createdTime: createdAtParts.time,
      };
    });

    return mapped.filter((booking) => {
      if (filters.type === "flight" && booking.type !== "Flight") {
        return false;
      }

      if (filters.type === "hotel" && booking.type !== "Hotel") {
        return false;
      }

      if (filters.type === "umrah" && booking.type !== "Umrah") {
        return false;
      }

      if (filters.type === "visa" && booking.type !== "Visa") {
        return false;
      }

      if (filters.type === "tour" && booking.type !== "Tour") {
        return false;
      }

      if (filters.paymentMethod) {
        return booking.paymentMethod.toLowerCase() === filters.paymentMethod;
      }

      return true;
    });
  } catch (err) {
    markDatabaseUnavailable(err);
    return [];
  }
}
