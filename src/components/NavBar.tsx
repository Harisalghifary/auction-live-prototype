"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // live auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const avatarInitial = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 border-b border-obsidian-700 bg-obsidian-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-bold tracking-wide text-gold-400 transition hover:text-gold-300">
          Anti-Gravity<span className="text-platinum-300"> Auction</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-obsidian-700" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* KYC indicator */}
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-lg border border-obsidian-700 px-3 py-1.5 font-body text-sm text-platinum-300 transition hover:border-gold-600/40 hover:text-gold-400 sm:flex"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/20 font-body text-xs font-bold text-gold-400"
                  aria-label={`Logged in as ${user.email}`}
                >
                  {avatarInitial}
                </span>
                <span className="max-w-[120px] truncate">{user.email}</span>
              </Link>

              {/* Mobile avatar only */}
              <Link
                href="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500/20 font-body text-xs font-bold text-gold-400 sm:hidden"
                aria-label="My Profile"
              >
                {avatarInitial}
              </Link>

              <button
                onClick={handleSignOut}
                className="rounded-lg border border-obsidian-700 px-3 py-1.5 font-body text-sm text-platinum-500 transition hover:border-auction-live/40 hover:text-auction-live"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-obsidian-700 px-4 py-2 font-body text-sm text-platinum-300 transition hover:border-gold-600/50 hover:text-gold-400"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
