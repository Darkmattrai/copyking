// Meta Graph API helpers for the Instagram integration (Facebook Login flow).
// Server-only — never import into client components.

const GRAPH_VERSION = "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const OAUTH_DIALOG = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

// Phase 1 reads the profile only. Publishing / insights / messaging scopes get
// added in later phases (after app review):
//   instagram_content_publish, instagram_manage_insights, instagram_manage_messages
export const IG_SCOPES = [
  "instagram_basic",
  "pages_show_list",
  "pages_read_engagement",
];

export function appCredentials() {
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  // Facebook Login for Business uses a saved login configuration (config_id)
  // that defines the permissions + asset picker, instead of a raw scope list.
  const configId = process.env.META_LOGIN_CONFIG_ID;
  return { clientId, clientSecret, configId, configured: Boolean(clientId && clientSecret) };
}

export function buildAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  configId?: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    state: opts.state,
  });
  if (opts.configId) {
    // Facebook Login for Business — the configuration defines permissions + assets.
    params.set("config_id", opts.configId);
  } else {
    // Classic Facebook Login fallback.
    params.set("scope", IG_SCOPES.join(","));
  }
  return `${OAUTH_DIALOG}?${params.toString()}`;
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = (data.error as { message?: string })?.message;
    throw new Error(err || `Meta API error ${res.status}`);
  }
  return data;
}

// code → short-lived user access token
export async function exchangeCode(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<string> {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    code: opts.code,
  });
  const data = await getJson(`${GRAPH}/oauth/access_token?${params.toString()}`);
  return String(data.access_token);
}

// short-lived → long-lived (~60 day) user access token
export async function longLivedToken(opts: {
  clientId: string;
  clientSecret: string;
  token: string;
}): Promise<{ token: string; expiresInSec: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    fb_exchange_token: opts.token,
  });
  const data = await getJson(`${GRAPH}/oauth/access_token?${params.toString()}`);
  return {
    token: String(data.access_token),
    expiresInSec: Number(data.expires_in ?? 0),
  };
}

export interface IgAccount {
  igUserId: string;
  pageId: string;
  pageName: string;
  pageToken: string;
}

interface RawPage {
  id?: string;
  name?: string;
  access_token?: string;
  // Meta exposes a Page's IG account under either field depending on how it
  // was linked — check both.
  instagram_business_account?: { id?: string };
  connected_instagram_account?: { id?: string };
}

// Find the user's Page that has a connected Instagram Business/Creator account.
// Returns the account plus a human-readable debug string of what Facebook
// returned (surfaced on screen when no account is found).
export async function resolveInstagram(
  userToken: string,
): Promise<{ account: IgAccount | null; debug: string }> {
  const params = new URLSearchParams({
    fields:
      "id,name,access_token,instagram_business_account{id,username},connected_instagram_account{id,username}",
    access_token: userToken,
  });
  const data = await getJson(`${GRAPH}/me/accounts?${params.toString()}`);
  const pages = ((data.data as RawPage[]) ?? []) as RawPage[];

  const debug =
    pages.length === 0
      ? "Facebook returned 0 Pages — the app wasn't granted access to a Page (re-run login and tick your Page)."
      : "Pages: " +
        pages
          .map(
            (p) =>
              `${p.name || p.id} [IG: ${
                p.instagram_business_account?.id
                  ? "business"
                  : p.connected_instagram_account?.id
                    ? "connected"
                    : "none"
              }]`,
          )
          .join("; ");
  console.log("[instagram] " + debug);

  for (const page of pages) {
    const igId =
      page.instagram_business_account?.id ??
      page.connected_instagram_account?.id;
    if (igId && page.id && page.access_token) {
      return {
        account: {
          igUserId: igId,
          pageId: page.id,
          pageName: page.name ?? "",
          pageToken: page.access_token,
        },
        debug,
      };
    }
  }
  return { account: null, debug };
}

export interface IgProfile {
  username: string;
  name: string;
  biography: string;
  website: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  profilePictureUrl: string;
}

export async function fetchProfile(
  igUserId: string,
  token: string,
): Promise<IgProfile> {
  const params = new URLSearchParams({
    fields:
      "username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url",
    access_token: token,
  });
  const data = await getJson(`${GRAPH}/${igUserId}?${params.toString()}`);
  return {
    username: String(data.username ?? ""),
    name: String(data.name ?? ""),
    biography: String(data.biography ?? ""),
    website: String(data.website ?? ""),
    followersCount: Number(data.followers_count ?? 0),
    followsCount: Number(data.follows_count ?? 0),
    mediaCount: Number(data.media_count ?? 0),
    profilePictureUrl: String(data.profile_picture_url ?? ""),
  };
}
