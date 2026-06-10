import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  appCredentials,
  exchangeCode,
  longLivedToken,
  resolveInstagram,
  fetchProfile,
  IG_SCOPES,
} from "@/lib/instagram/meta";

// Handles the OAuth redirect: verifies state, exchanges the code for a
// long-lived token, resolves the connected IG account, reads the profile, and
// stores the connection (server-side only — tokens never reach the browser).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = new URL("/generate/instagram-bio", url.origin);
  const fail = (reason: string, detail?: string) => {
    back.searchParams.set("ig", reason);
    if (detail) back.searchParams.set("ig_detail", detail.slice(0, 300));
    const res = NextResponse.redirect(back);
    res.cookies.delete("ig_oauth_state");
    return res;
  };

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return fail("denied");

  const cookieState = req.cookies.get("ig_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("error");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  const { clientId, clientSecret, configured } = appCredentials();
  if (!configured || !clientId || !clientSecret) return fail("error");

  try {
    const redirectUri = `${url.origin}/api/instagram/callback`;
    const shortTok = await exchangeCode({ clientId, clientSecret, redirectUri, code });
    const { token: longTok, expiresInSec } = await longLivedToken({
      clientId,
      clientSecret,
      token: shortTok,
    });

    const { account: acct, debug } = await resolveInstagram(longTok);
    if (!acct) return fail("no-account", debug);

    const profile = await fetchProfile(acct.igUserId, acct.pageToken);

    const admin = createAdminClient();
    const tokenExpiresAt = expiresInSec
      ? new Date(Date.now() + expiresInSec * 1000).toISOString()
      : null;

    await admin.from("instagram_connections").upsert(
      {
        user_id: user.id,
        ig_user_id: acct.igUserId,
        ig_username: profile.username,
        page_id: acct.pageId,
        page_name: acct.pageName,
        user_access_token: longTok,
        page_access_token: acct.pageToken,
        token_expires_at: tokenExpiresAt,
        scopes: IG_SCOPES.join(","),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return fail("connected"); // reuse the redirect helper; "connected" is success
  } catch (err) {
    console.error("[instagram/callback] error:", err);
    return fail("error");
  }
}
