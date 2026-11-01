import Image from "next/image";

import type { BrandAssetSlot, BrandAssets } from "@/lib/brand-assets";

const reasons: { icon: BrandAssetSlot; title: string; body: string }[] = [
  {
    icon: "whyPrices",
    title: "Transparent prices",
    body: "Compare fares and packages with no hidden fees at checkout.",
  },
  {
    icon: "whySupport",
    title: "24/7 live support",
    body: "Real travel experts in the UK and Pakistan, before and during your trip.",
  },
  {
    icon: "whySecure",
    title: "Secure booking",
    body: "Encrypted payments and protected personal details.",
  },
  {
    icon: "whyUmrah",
    title: "Umrah specialists",
    body: "Hotels near the Haram, visas and transport handled for you.",
  },
];

/** Icons come from Admin → Media → Brand & Icons; an unset icon is not shown. */
export function WhyBookSection({
  brandName,
  phone,
  assets,
}: {
  brandName: string;
  phone: string;
  assets: BrandAssets;
}) {
  return (
    <section
      className="section-shell py-6 md:py-8"
      aria-label={`Why book with ${brandName}`}
    >
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
        Why book with {brandName}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map(({ icon, title, body }) => (
          <div key={title} className="flex gap-4">
            {assets[icon] ? (
              <Image
                src={assets[icon]}
                alt=""
                width={48}
                height={48}
                className="size-12 shrink-0 object-contain"
              />
            ) : null}
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>
      {phone ? (
        <div className="mt-10 flex justify-center">
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            {assets.hotline ? (
              <Image
                src={assets.hotline}
                alt=""
                width={20}
                height={20}
                className="size-5 object-contain"
              />
            ) : null}
            Hotline: {phone}
          </a>
        </div>
      ) : null}
    </section>
  );
}
