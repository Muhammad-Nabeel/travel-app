"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryPhoto = { src: string; alt: string };

// Thumbnail cells beside the lead photo, by how many thumbnails there are.
const THUMB_LAYOUT: Record<number, string[]> = {
  1: ["col-span-2 row-span-2"],
  2: ["col-span-2", "col-span-2"],
  3: ["col-span-2", "", ""],
  4: ["", "", "", ""],
};

function isRemote(src: string) {
  return /^https?:\/\//.test(src);
}

function Photo({
  photo,
  sizes,
  lead = false,
}: {
  photo: GalleryPhoto;
  sizes: string;
  lead?: boolean;
}) {
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      fetchPriority={lead ? "high" : undefined}
      loading={lead ? "eager" : "lazy"}
      unoptimized={isRemote(photo.src)}
      className="object-cover transition duration-300 group-hover:scale-[1.03]"
    />
  );
}

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  const count = photos.length;
  const open = useCallback((i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  }, []);
  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [step]);

  if (count === 0) return null;

  const [lead, ...rest] = photos;
  const thumbs = rest.slice(0, 4);
  const thumbLayout = THUMB_LAYOUT[thumbs.length] ?? [];

  return (
    <>
      <div className="relative">
        {thumbs.length === 0 ? (
          <div className="relative aspect-4/3 overflow-hidden rounded-card bg-subtle sm:aspect-21/9">
            <Photo photo={lead} sizes="(min-width: 1200px) 1200px, 100vw" lead />
          </div>
        ) : (
          <div className="grid aspect-4/3 grid-cols-1 gap-2 overflow-hidden rounded-card sm:aspect-auto sm:h-105 sm:grid-cols-4 sm:grid-rows-2">
            <button
              type="button"
              onClick={() => open(0)}
              className="group relative overflow-hidden bg-subtle sm:col-span-2 sm:row-span-2"
              aria-label={`Open photo 1 of ${count}: ${lead.alt}`}
            >
              <Photo photo={lead} sizes="(min-width: 640px) 600px, 100vw" lead />
            </button>
            {thumbs.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => open(i + 1)}
                className={`group relative hidden overflow-hidden bg-subtle sm:block ${thumbLayout[i]}`}
                aria-label={`Open photo ${i + 2} of ${count}: ${photo.alt}`}
              >
                <Photo photo={photo} sizes="300px" />
              </button>
            ))}
          </div>
        )}

        {count > 1 ? (
          <button
            type="button"
            onClick={() => open(0)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:shadow-raised"
          >
            <Grid2x2 className="size-4" />
            See all {count} photos
          </button>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Photo gallery"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-navy/95 p-0 text-white backdrop:bg-transparent"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm tabular-nums text-white/80">
              {index + 1} / {count}
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="flex size-11 items-center justify-center rounded-full transition hover:bg-white/10"
              aria-label="Close gallery"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            <div className="relative h-full w-full max-w-5xl">
              <Image
                key={photos[index].src}
                src={photos[index].src}
                alt={photos[index].alt}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                unoptimized={isRemote(photos[index].src)}
                className="object-contain"
              />
            </div>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:left-4"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 sm:right-4"
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}
          </div>

          <p className="px-4 py-4 text-center text-sm text-white/80">
            {photos[index].alt}
          </p>
        </div>
      </dialog>
    </>
  );
}
