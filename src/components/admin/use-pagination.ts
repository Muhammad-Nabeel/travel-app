"use client";

import { useState } from "react";

import { ADMIN_PAGE_SIZE, clampPage, getPageCount } from "@/components/admin/pagination";

/** Client-side paging over rows already in memory. */
export function usePagination<T>(items: T[]) {
  const [requestedPage, setPage] = useState(1);
  const pageCount = getPageCount(items.length);
  // After a delete or filter shrinks the list, show the last real page.
  const page = clampPage(requestedPage, pageCount);

  return {
    page,
    setPage,
    pageCount,
    total: items.length,
    pageItems: items.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE),
  };
}
