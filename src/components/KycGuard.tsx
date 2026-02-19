"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/auction";

interface KycGuardProps {
  children: React.ReactNode;
  /** If true, unverified bidders can VIEW but not bid (default: full block) */
  softBlock?: boolean;
}

/**
 * KycGuard — blocks access to live bidding for unverified users.
 * Enforces KNOWLEDGE.md § 4: "All bidders must have a verified profile
 * and a payment method on file before entering a LIVE auction room."
 */
export function KycGuard({ children, softBlock = false }: KycGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "unverified">("loading");

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser() as { data: { user: User | null } };

      if (!user) {
        setStatus("unauth");
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified_bidder")
        .eq("id", user.id)
        .single() as { data: Pick<Profile, "is_verified_bidder"> | null };

      if (!profile?.is_verified_bidder) {
        setStatus("unverified");
        return;
      }

      setStatus("ok");
    }
    check();
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" aria-label="Loading..." />
      </div>
    );
  }

  if (status === "unverified") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="rounded-full bg-gold-500/10 p-4 text-gold-500">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-platinum-200">Verify Your Account</h2>
        <p className="max-w-sm font-body text-platinum-500">
          To comply with auction regulations (KYC), you must verify your identity and add a payment method before bidding live.
        </p>
        <a
          href="/profile/verify"
          className="rounded-xl bg-gold-500 px-6 py-3 font-body font-semibold text-obsidian-950 hover:bg-gold-400 transition"
        >
          Start Verification →
        </a>
        {softBlock && children}
      </div>
    );
  }

  if (status === "unauth") return null;

  return <>{children}</>;
}
