import { DestinationsSlider } from "@/components/destinations-slider";
import { ActivitiesSlider } from "@/components/activities-slider";
import { FlightSearchEngine } from "@/components/flight-search";

export default function Home() {
  return (
    <main className="flex-1">
      <FlightSearchEngine />

      <DestinationsSlider />

      <ActivitiesSlider />

      {/* Customer Support Section */}
      <section className="section-shell py-10" aria-label="Customer support">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Heading column */}
            <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                  Live now
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Real people, available 24/7
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Speak directly with a live representative on WhatsApp or phone —
                available now for bookings, Umrah packages, flight queries, and
                any urgent travel needs.
              </p>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col justify-between gap-5 p-6 md:p-8">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10">
                  {/* WhatsApp logo SVG */}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-[#25D366]"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    WhatsApp — Live Representative
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Message us now · instant replies · booking support
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="https://wa.me/447933837137"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20"
                >
                  <span>+44 7933 837137</span>
                  <span className="text-xs font-medium text-slate-500">UK</span>
                </a>
                <a
                  href="https://wa.me/923072477709"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20"
                >
                  <span>+92 307 2477709</span>
                  <span className="text-xs font-medium text-slate-500">PK</span>
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col justify-between gap-5 p-6 md:p-8">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-sky-600"
                    aria-hidden="true"
                  >
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Phone — Live Representative
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Call us now · 24/7 · speak to someone directly
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="tel:+447933837137"
                  className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                >
                  <span>+44 7933 837137</span>
                  <span className="text-xs font-medium text-slate-500">UK</span>
                </a>
                <a
                  href="tel:+923072477709"
                  className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                >
                  <span>+92 307 2477709</span>
                  <span className="text-xs font-medium text-slate-500">PK</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
