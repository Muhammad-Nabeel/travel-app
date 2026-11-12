import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { isValidBookingClaim } from "@/lib/bookings/link-user";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/providers/auth/auth-provider";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Add Booking to Account",
  description: "Add a booking made as a guest to your account.",
  path: "/dashboard",
  noIndex: true,
});

type ClaimPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/**
 * Opened from the "Add this booking to my account" link in a guest booking's
 * confirmation email. The booking joins the signed-in account only if that
 * account's verified email is the one the booking was made with.
 */
export default async function ClaimBookingPage({ searchParams }: ClaimPageProps) {
  const { booking: bookingId = "", sig = "" } = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    const back = `/dashboard/bookings/claim?${new URLSearchParams({ booking: bookingId, sig })}`;
    redirect(`/signin?callbackUrl=${encodeURIComponent(back)}`);
  }

  const [user, booking] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerifiedAt: true } }),
    bookingId
      ? prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, reference: true, userId: true, customerEmail: true },
        })
      : null,
  ]);

  const bookingEmail = booking?.customerEmail?.trim().toLowerCase() ?? "";
  let problem: string | null = null;

  if (!booking || !bookingEmail || !isValidBookingClaim(booking.id, bookingEmail, sig)) {
    problem = "This link is not valid. Please use the link from your booking confirmation email.";
  } else if (booking.userId && booking.userId !== userId) {
    problem = "This booking is already linked to another account.";
  } else if (!user?.emailVerifiedAt) {
    problem = "Please verify your email address first, then open the link again.";
  } else if (user.email.toLowerCase() !== bookingEmail) {
    problem = `This booking was made with a different email. Sign in with the account for ${bookingEmail} to add it.`;
  }

  if (!problem && booking) {
    if (!booking.userId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { userId } });
    }
    redirect(`/dashboard/bookings/${booking.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Couldn&apos;t add this booking</h1>
      <p className="mt-3 text-sm text-muted">{problem}</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
      >
        Go to my bookings
      </Link>
    </div>
  );
}
