"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const { status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
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

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed.");
      }

      // auto login after register
      await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-rose-100 px-6 py-8 max-w-sm w-full">
        <h1 className="text-2xl font-semibold mb-2 text-rose-900">
          Create your account
        </h1>
        <p className="text-sm text-rose-600 mb-6">
          Sign up to start building and saving your outfits.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-rose-800">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-rose-50/60"
            />
          </div>

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
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-xs text-rose-600 text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-pink-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
