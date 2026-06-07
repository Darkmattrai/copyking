"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-2">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            {isSignup ? "Create your CopyKing account" : "Sign in to CopyKing"}
          </h1>
          <p className="text-sm text-text-tertiary">
            {isSignup
              ? "Sign up to start building your brand"
              : "Enter your credentials to access your account"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="ck-label" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="ck-input"
              id="email"
              name="email"
              placeholder="you@darkmattr.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="ck-label" htmlFor="password">
              Password
            </label>
            <input
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="ck-input"
              id="password"
              name="password"
              placeholder={isSignup ? "Create a password" : "Enter your password"}
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger text-center">{error}</p>}
          {message && (
            <p className="text-sm text-success text-center">{message}</p>
          )}

          <button
            className="ck-btn-primary w-full"
            disabled={loading}
            type="submit"
          >
            {loading
              ? isSignup
                ? "Creating account..."
                : "Signing in..."
              : isSignup
                ? "Sign up"
                : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-text-tertiary text-center">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            className="text-accent hover:underline"
            type="button"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError(null);
              setMessage(null);
            }}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
