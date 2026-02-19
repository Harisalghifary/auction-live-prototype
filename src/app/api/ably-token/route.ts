import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Ably from "ably";

/**
 * GET /api/ably-token
 *
 * Issues a short-lived Ably token request for the authenticated user.
 * The client calls this instead of using a long-lived JWT.
 *
 * Security:
 * - Requires a valid Supabase session (must be logged in)
 * - Uses the server-side ABLY_API_KEY (never exposed to the browser)
 * - Token TTL: 3600s (1 hour), auto-renewable by the client SDK
 *
 * Ably docs: https://ably.com/docs/auth/token-authentication
 */
export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    console.error("[ably-token] ABLY_API_KEY env var is not set");
    return NextResponse.json({ error: "Ably not configured" }, { status: 500 });
  }

  try {
    const rest = new Ably.Rest(apiKey);
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId: user.id,       // bind token to this user
      ttl: 3600 * 1000,        // 1 hour in ms
      capability: {
        // Allow subscribe on all lot channels + personal notification channel
        "lot:*": ["subscribe"],
        [`user:${user.id}`]: ["subscribe"],
      },
    });

    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error("[ably-token] Failed to create token request:", err);
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
