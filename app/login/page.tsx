"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsSubmitting(false);

    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.replace("/");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-rose-100 px-6 py-8 max-w-sm w-full">
        <h1 className="text-2xl font-semibold mb-2 text-rose-900">
          Login to Outfit Builder
        </h1>
        <p className="text-sm text-rose-600 mb-6">
          Welcome back! Sign in to manage your wardrobe and outfits.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-rose-800">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-rose-50/60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-rose-800">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-rose-50/60"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2 border border-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs text-rose-600 text-center">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-pink-600 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
