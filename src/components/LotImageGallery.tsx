"use client";

/**
 * LotImageGallery — interactive image gallery for the lot detail page.
 * Clicking a thumbnail swaps the main displayed image.
 * Falls back to a placeholder SVG when no images are available.
 */

import { useState } from "react";
import Image from "next/image";

interface LotImageGalleryProps {
  imageUrls: string[];
  title: string;
}

export function LotImageGallery({ imageUrls, title }: LotImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeUrl = imageUrls[activeIndex] ?? null;

  return (
    <div className="mb-6">
      {/* Main image */}
      <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-obsidian-800">
        {activeUrl ? (
          <Image
            key={activeUrl}
            src={activeUrl}
            alt={`${title} — image ${activeIndex + 1}`}
            fill
            priority
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-platinum-500 opacity-30">
            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Image counter badge */}
        {imageUrls.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-obsidian-950/70 px-2.5 py-1 font-body text-xs text-platinum-300 backdrop-blur-sm">
            {activeIndex + 1} / {imageUrls.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 ${
                i === activeIndex
                  ? "border-gold-500 opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={url}
                alt={`${title} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
