import { BadgeCheck, Headphones, ShieldCheck, Wallet } from "lucide-react";

const reasons = [
  {
    icon: Wallet,
    title: "Transparent prices",
    body: "Compare fares and packages with no hidden fees at checkout.",
  },
  {
    icon: Headphones,
    title: "24/7 live support",
    body: "Real travel experts in the UK and Pakistan, before and during your trip.",
  },
  {
    icon: ShieldCheck,
    title: "Secure booking",
    body: "Encrypted payments and protected personal details.",
  },
  {
    icon: BadgeCheck,
    title: "Umrah specialists",
    body: "Hotels near the Haram, visas and transport handled for you.",
  },
];

export function WhyBookSection() {
  return (
    <section className="section-shell py-12 md:py-16" aria-label="Why book with Safar">
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
        Why book with Safar
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon className="size-6" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
