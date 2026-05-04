"use client";

import { useEffect } from "react";

type WiseReturnLoggerProps = {
  bookingReference: string;
  page: "success" | "failed";
};

export function WiseReturnLogger({
  bookingReference,
  page,
}: WiseReturnLoggerProps) {
  useEffect(() => {
    if (!bookingReference) return;

    void fetch("/api/payments/wise/return-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingReference,
        outcome: page,
        page,
      }),
    });
  }, [bookingReference, page]);

  return null;
}
