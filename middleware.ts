import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  clientCanAccess,
  clientCanAccessApi,
  CLIENT_HOME,
  type UserRole,
} from "@/lib/auth/roles";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(supabaseUrl, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not add logic between createServerClient and getUser().
  // getUser() triggers token refresh when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !pathname.startsWith("/login")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/brand";
    return NextResponse.redirect(url);
  }

  // Role-based gating: clients are limited to the two Foundation tools.
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role: UserRole = (data?.role as UserRole) ?? "client";

    if (role === "client") {
      const isApi = pathname.startsWith("/api/");
      const allowed = isApi
        ? clientCanAccessApi(pathname)
        : clientCanAccess(pathname);

      if (!allowed) {
        if (isApi) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const url = request.nextUrl.clone();
        url.pathname = CLIENT_HOME;
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
