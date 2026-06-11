// Single source of truth for role-based access control.
//
// - admin  : full access (you / the owner) + the /admin dashboard
// - client : restricted to the two Foundation tools only

export type UserRole = "admin" | "client";

// Generator slugs a client account is allowed to open.
export const CLIENT_GENERATOR_SLUGS = [
  "icp-map",
  "irresistible-offer",
  "instagram-bio",
] as const;

// Exact paths a client may visit. Anything under /generate/<slug> is also
// allowed only if <slug> is in CLIENT_GENERATOR_SLUGS (checked separately).
const CLIENT_ALLOWED_EXACT = new Set<string>([
  "/overview",
  "/generate",
  "/account",
  "/login",
  "/auth/callback",
]);

// Where each role lands after login / when blocked from a page.
export const CLIENT_HOME = "/overview";
export const ADMIN_HOME = "/brand";

export function roleHome(role: UserRole): string {
  return role === "admin" ? ADMIN_HOME : CLIENT_HOME;
}

// True if a client account is permitted to view this pathname.
export function clientCanAccess(pathname: string): boolean {
  if (CLIENT_ALLOWED_EXACT.has(pathname)) return true;

  if (pathname.startsWith("/generate/")) {
    const slug = pathname.split("/")[2] ?? "";
    return (CLIENT_GENERATOR_SLUGS as readonly string[]).includes(slug);
  }

  return false;
}

// True if a client may call this API route.
export function clientCanAccessApi(pathname: string): boolean {
  // The generic generate route is allowed as an EXACT path only — it slug-gates
  // clients to CLIENT_GENERATOR_SLUGS internally. The /api/generate/stories-tools
  // sub-route has no gate of its own, so it must stay blocked (no prefix match).
  if (pathname === "/api/generate") return true;

  // Clients need the ICP Map + Offer endpoints, the full Instagram toolset
  // (connect, callback, status, profile, content, audit), and shared infra
  // (generations, brand profile sync, auth).
  const allowedPrefixes = [
    "/api/me",
    "/api/icp/",
    "/api/offer/",
    "/api/generations",
    "/api/brand/profile",
    "/api/auth",
    "/api/instagram/",
    "/api/transcribe",
  ];
  return allowedPrefixes.some((p) => pathname.startsWith(p));
}
