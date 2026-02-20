"use client";

/**
 * LotFilters — search + filter bar for the home page.
 * - Full-text search (q) with localStorage recent searches
 * - Status tabs: All / Live / Upcoming / Closed
 * - Category pill filter
 * - Sort dropdown
 *
 * All state is stored in URL searchParams so it's shareable + server-rendered.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const STATUS_TABS = [
  { value: "",        label: "All" },
  { value: "LIVE",    label: "🔴 Live" },
  { value: "PRE_BID", label: "Upcoming" },
  { value: "SOLD",    label: "Sold" },
];

const SORT_OPTIONS = [
  { value: "newest",       label: "Newest" },
  { value: "price_asc",    label: "Price: Low → High" },
  { value: "price_desc",   label: "Price: High → Low" },
  { value: "ending_soon",  label: "Ending Soon" },
];

const RECENT_KEY = "ag_recent_searches";
const MAX_RECENT = 5;

interface LotFiltersProps {
  categories: string[];
}

export function LotFilters({ categories }: LotFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q        = searchParams.get("q") ?? "";
  const status   = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort     = searchParams.get("sort") ?? "newest";

  const [input, setInput]             = useState(q);
  const [showRecent, setShowRecent]   = useState(false);
  const [recentSearches, setRecent]   = useState<string[]>([]);
  const inputRef                      = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const buildUrl = useCallback((overrides: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries({ q, status, category, sort, ...overrides }).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    return `${pathname}?${params.toString()}`;
  }, [searchParams, q, status, category, sort, pathname]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setInput(trimmed);
    setShowRecent(false);

    // Save to recent searches
    if (trimmed) {
      const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
      setRecent(updated);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
    }

    router.push(buildUrl({ q: trimmed }));
  };

  const clearSearch = () => {
    setInput("");
    setShowRecent(false);
    router.push(buildUrl({ q: "" }));
  };

  const removeRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecent(updated);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const inputCls = "bg-obsidian-900 border border-obsidian-600 text-platinum-200 placeholder-platinum-500 focus:border-gold-500 focus:outline-none font-body text-sm";
  const tabCls   = (active: boolean) =>
    `px-4 py-2 rounded-xl font-body text-sm font-medium transition whitespace-nowrap ${
      active ? "bg-gold-500 text-obsidian-950" : "border border-obsidian-600 text-platinum-400 hover:border-gold-500/50 hover:text-platinum-200"
    }`;

  return (
    <div className="mb-10 flex flex-col gap-4">
      {/* Search row */}
      <div className="relative">
        <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 ${inputCls}`}>
          {/* Search icon */}
          <svg className="h-4 w-4 shrink-0 text-platinum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={input}
            placeholder="Search lots — watches, ceramics, prints…"
            className="flex-1 bg-transparent text-sm text-platinum-200 placeholder-platinum-500 focus:outline-none"
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 150)}
            onKeyDown={(e) => { if (e.key === "Enter") applySearch(input); }}
          />
          {input && (
            <button onClick={clearSearch} className="text-platinum-500 hover:text-platinum-200 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => applySearch(input)}
            className="ml-1 rounded-xl bg-gold-500 px-4 py-1.5 font-body text-xs font-bold text-obsidian-950 transition hover:bg-gold-400"
          >
            Search
          </button>
        </div>

        {/* Recent searches dropdown */}
        {showRecent && recentSearches.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-obsidian-600 bg-obsidian-900 shadow-2xl">
            <p className="px-4 pt-3 pb-1 font-body text-[10px] font-semibold uppercase tracking-widest text-platinum-500">Recent Searches</p>
            {recentSearches.map((term) => (
              <button
                key={term}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-obsidian-800 transition"
                onMouseDown={() => { setInput(term); applySearch(term); }}
              >
                <span className="flex items-center gap-2 font-body text-sm text-platinum-300">
                  <svg className="h-3.5 w-3.5 text-platinum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {term}
                </span>
                <span
                  className="text-platinum-600 hover:text-auction-live transition text-xs"
                  onMouseDown={(e) => removeRecent(term, e)}
                >
                  ✕
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} className={tabCls(status === tab.value)} onClick={() => router.push(buildUrl({ status: tab.value }))}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => router.push(buildUrl({ category: e.target.value }))}
            className="rounded-xl border border-obsidian-600 bg-obsidian-900 px-3 py-2 font-body text-sm text-platinum-300 focus:border-gold-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
          className="rounded-xl border border-obsidian-600 bg-obsidian-900 px-3 py-2 font-body text-sm text-platinum-300 focus:border-gold-500 focus:outline-none ml-auto"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
