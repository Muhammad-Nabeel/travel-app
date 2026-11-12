"use client";

import { useEffect } from "react";

import { trackEcommerceEvent } from "@/lib/analytics/ga4-events";

/**
 * Sends GA4 `view_item` once when a package or visa detail page opens.
 * Renders nothing; drop it into a server page with the item's details.
 */
export function ViewItemTracker({
  itemId,
  itemName,
  itemCategory,
  price,
  currency,
}: {
  itemId: string;
  itemName: string;
  /** Service the item belongs to: "umrah", "tour" or "visa". */
  itemCategory: "umrah" | "tour" | "visa";
  price: number;
  currency: string;
}) {
  useEffect(() => {
    trackEcommerceEvent("view_item", {
      currency,
      value: price,
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          item_category: itemCategory,
          price,
          quantity: 1,
        },
      ],
    });
  }, [itemId, itemName, itemCategory, price, currency]);

  return null;
}
