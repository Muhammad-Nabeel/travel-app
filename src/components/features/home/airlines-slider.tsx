import Image from "next/image";

const AIRLINES = [
  { name: "Emirates", src: "/airlines/ek.gif" },
  { name: "Qatar Airways", src: "/airlines/qr.gif" },
  { name: "Etihad Airways", src: "/airlines/ey.gif" },
  { name: "Turkish Airlines", src: "/airlines/tk.gif" },
  { name: "British Airways", src: "/airlines/ba.gif" },
  { name: "Saudi", src: "/airlines/sv.gif" },
  { name: "Air Arabia", src: "/airlines/Air-Arabia-Logo.jpg" },
  { name: "Flydubai", src: "/airlines/fz.png" },
  { name: "PIA", src: "/airlines/pk.png" },
  { name: "Airblue", src: "/airlines/Airblue_Logo.png" },
  { name: "Serene Air", src: "/airlines/serene-logo.jpg" },
  { name: "Kuwait Airways", src: "/airlines/ku.gif" },
];

const LOOPED_AIRLINES = [...AIRLINES, ...AIRLINES];

export function AirlinesSlider() {
  return (
    <section className="section-shell py-10" aria-label="Leading airlines">
      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
              Trusted airline partners
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Book with leading airlines
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Search and compare fares across top regional and international
              carriers in one place.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-white to-transparent" />

          <div className="airline-marquee flex w-max items-center gap-4">
            {LOOPED_AIRLINES.map((airline, index) => (
              <div
                key={`${airline.name}-${index}`}
                className="flex h-24 w-40 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <Image
                  src={airline.src}
                  alt={airline.name}
                  width={128}
                  height={56}
                  className="max-h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
