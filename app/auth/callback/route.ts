import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-role";
import { roleHome } from "@/lib/auth/roles";

// OAuth / email-confirmation callback: exchanges the auth code for a session
// cookie, then redirects into the app based on the user's role.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const dest = next ?? roleHome((await getUserRole()) ?? "client");
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
