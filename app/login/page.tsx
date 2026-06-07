"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { roleHome, type UserRole } from "@/lib/auth/roles";

type Mode = "signin" | "signup";

async function goToRoleHome(router: ReturnType<typeof useRouter>) {
  let role: UserRole = "client";
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.role === "admin" || data?.role === "client") role = data.role;
    }
  } catch {
    // fall back to client home
  }
  router.push(roleHome(role));
  router.refresh();
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If email confirmation is on, there's no active session yet.
      if (!data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("signin");
        setLoading(false);
        return;
      }

      await goToRoleHome(router);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    await goToRoleHome(router);
  }

  async function handleGoogle() {
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // On success the browser is redirected to Google, so no further work here.
  }

  const isSignup = mode === "signup";
  const googleEnabled =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] px-4">
      <div className="ck-glow left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2" />

      <div className="relative w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black text-white">
              CK
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">
              COPY KING
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isSignup ? "Create your Copy King account" : "Welcome back"}
          </h1>
          <p className="text-sm text-white/50">
            {isSignup
              ? "Start generating high-converting copy in seconds."
              : "Sign in to keep writing copy that converts."}
          </p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          onSubmit={handleSubmit}
        >
          {googleEnabled && (
            <>
              <button
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                disabled={loading}
                type="button"
                onClick={handleGoogle}
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 48 48">
                  <path
                    d="M44.5 20H24v8.5h11.8C34.7 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l6-6C42.9 4.6 38.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.7-.5-4z"
                    fill="#FFC107"
                  />
                  <path
                    d="M6.3 14.7l7 5.1C15.2 16 19.2 13 24 13c3.3 0 6.3 1.2 8.6 3.3l6-6C42.9 4.6 38.7 3 24 3 16 3 9.1 7.6 6.3 14.7z"
                    fill="#FF3D00"
                  />
                  <path
                    d="M24 45c5.9 0 11.3-2.3 15.4-6l-7.1-5.8C30.1 34.8 27.2 36 24 36c-6 0-11-4-12.9-9.6l-7 5.4C7 39.4 14.8 45 24 45z"
                    fill="#4CAF50"
                  />
                  <path
                    d="M44.5 20H24v8.5h11.8c-1 2.9-3 5.3-5.5 6.7l7.1 5.8C42.1 37.9 45 31.7 45 24c0-1.4-.2-2.7-.5-4z"
                    fill="#1976D2"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/30">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500"
              id="email"
              name="email"
              placeholder="you@company.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80" htmlFor="password">
              Password
            </label>
            <input
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-500"
              id="password"
              name="password"
              placeholder={isSignup ? "Create a password" : "Enter your password"}
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          {message && (
            <p className="text-center text-sm text-green-400">{message}</p>
          )}

          <button
            className="w-full rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            disabled={loading}
            type="submit"
          >
            {loading
              ? isSignup
                ? "Creating account..."
                : "Signing in..."
              : isSignup
                ? "Sign up free"
                : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-white/50">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className="font-semibold text-violet-400 hover:underline"
            type="button"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError(null);
              setMessage(null);
            }}
          >
            {isSignup ? "Sign in" : "Sign up free"}
          </button>
        </p>

        <p className="text-center">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
