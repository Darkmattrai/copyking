import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { appCredentials, buildAuthUrl } from "@/lib/instagram/meta";

// Kicks off the Facebook Login OAuth flow to connect an Instagram account.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { clientId, configured } = appCredentials();
  if (!configured || !clientId) {
    return NextResponse.json(
      { error: "Instagram integration is not configured." },
      { status: 503 },
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/instagram/callback`;
  const state = randomBytes(16).toString("hex");

  const res = NextResponse.redirect(buildAuthUrl({ clientId, redirectUri, state }));
  // Short-lived, httpOnly CSRF state cookie — verified in the callback.
  res.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
