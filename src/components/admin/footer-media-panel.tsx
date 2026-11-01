"use client";

import { BrandAssetsPanel } from "@/components/admin/brand-assets-panel";
import { FooterBadgesPanel } from "@/components/admin/footer-badges-panel";

/** Media → Footer: footer icons and the payment/accreditation badge row. */
export function FooterMediaPanel() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-navy">Footer icons</h3>
          <p className="mt-1 text-xs text-muted">
            Icons next to the contact details and Help links. An empty slot
            shows no icon.
          </p>
        </div>
        <BrandAssetsPanel group="footer" />
      </section>
      <FooterBadgesPanel />
    </div>
  );
}
