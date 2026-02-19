"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lot } from "@/types/auction";
import { StatusBadge } from "./StatusBadge";
import { formatPrice } from "@/lib/bidUtils";

interface LotCardProps {
  lot: Lot;
}

export function LotCard({ lot }: LotCardProps) {
  const thumbnail = lot.image_urls?.[0] ?? null;
  const isLive = lot.status === "LIVE";

  return (
    <Link href={`/lot/${lot.id}`}>
      <motion.article
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-obsidian-700 bg-obsidian-800 transition-colors hover:border-gold-600/60"
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        aria-label={`Lot: ${lot.title}, current price ${formatPrice(lot.current_price)}, status ${lot.status}`}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-obsidian-900">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={lot.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-platinum-500">
              <svg className="h-16 w-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Gold shimmer overlay on hover */}
          <div className="absolute inset-0 bg-gold-shimmer opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Status badge overlay */}
          <div className="absolute left-3 top-3">
            <StatusBadge status={lot.status} />
          </div>

          {/* LIVE pulse ring */}
          {isLive && (
            <div className="absolute right-3 top-3 h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-auction-live opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-auction-live" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* Category */}
          {lot.category && (
            <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-gold-500">
              {lot.category}
            </span>
          )}

          {/* Title */}
          <h3 className="font-display text-lg font-semibold leading-snug text-platinum-200 line-clamp-2">
            {lot.title}
          </h3>

          {/* Price */}
          <div className="mt-auto flex items-end justify-between pt-3 border-t border-obsidian-700">
            <div>
              <p className="font-body text-[10px] uppercase tracking-widest text-platinum-500">
                {lot.status === "PRE_BID" ? "Starting at" : "Current Bid"}
              </p>
              <p className="font-display text-2xl font-bold text-gold-400">
                {formatPrice(lot.current_price || lot.starting_price)}
              </p>
            </div>
            <span className="rounded-lg border border-gold-600/30 bg-gold-600/10 px-3 py-1.5 font-body text-xs font-medium text-gold-400 transition-colors group-hover:bg-gold-600/20">
              {lot.status === "LIVE" ? "Bid Now →" : "View Lot →"}
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
