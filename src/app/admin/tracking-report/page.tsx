import type { Metadata } from "next";

import { TrackingReport } from "@/components/admin/tracking-report";

export const metadata: Metadata = {
  title: "Tracking Report",
};

export default function TrackingReportPage() {
  return <TrackingReport />;
}
