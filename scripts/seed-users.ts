/**
 * One-time script to create the two allowed CopyKing users in Supabase Auth.
 *
 * Usage:
 *   pnpm dlx tsx --env-file=.env.local scripts/seed-users.ts
 *
 * After running, disable signups in the Supabase Dashboard:
 *   Authentication > Settings > toggle off "Allow new users to sign up"
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const USERS = [
  { email: "mo@darkmattr.com", password: "CopyKing2026!" },
  { email: "aal@darkmattr.com", password: "CopyKing2026!" },
];

async function seed() {
  for (const { email, password } of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`User ${email} already exists — skipping.`);
      } else {
        console.error(`Failed to create ${email}:`, error.message);
      }
    } else {
      console.log(`Created ${email} (id: ${data.user.id})`);
    }
  }

  console.log(
    "\nDone. Remember to change passwords and disable signups in the Supabase Dashboard.",
  );
}

seed();
