import Image from "next/image";

/**
 * Full-bleed hero photo behind a search engine. A real <Image> (not a CSS
 * background) so the browser can preload it and next/image serves WebP at the
 * device's width. The parent must be `position: relative` and its content
 * positioned above this layer.
 */
export function HeroBackdrop({ src }: { src: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover object-[center_65%]"
      />
      <div className="hero-backdrop-overlay absolute inset-0" />
    </div>
  );
}
