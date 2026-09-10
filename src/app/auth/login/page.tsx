"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth, getLandingPathForRole } from "../../components/auth-context";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      router.replace(getLandingPathForRole(user.role));
    }
  }, [authLoading, user, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const validEmail = useMemo(() => /.+@.+\..+/.test(email), [email]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? "");
      setError(message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-6">
      <div className="grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Left hero with background image & welcome */}
        <div className="relative hidden md:block rounded-3xl overflow-hidden">
          <Image src="/hero-image.jpg" alt="Welcome" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 text-white">Selamat Datang!</h1>
            <p className="text-lg max-w-xl text-white/90">Senang melihatmu kembali, ayo masuk untuk melanjutkan</p>
          </div>
        </div>

        {/* Right card form */}
        <form onSubmit={onSubmit} className="relative rounded-3xl p-8 md:p-10 glass">
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: "0 0 0 1px rgba(59,130,246,0.25), inset 0 0 0 1px rgba(255,255,255,0.05)" }} />

          <h2 className="text-2xl font-semibold mb-6">Selamat Datang!</h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <label className="block text-sm mb-2">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
            style={{ borderColor: validEmail ? "var(--glass-border)" : "rgba(239,68,68,.6)" }}
            placeholder="Enter your email address"
          />
          {!validEmail && email && (
            <p className="mt-2 text-xs text-red-400">Masukkan email yang valid</p>
          )}

          <label className="block text-sm mt-4 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-transparent border px-4 py-2.5 pr-11 outline-none focus:border-blue-500"
              style={{ borderColor: "var(--glass-border)" }}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {showPassword ? (
                  <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><line x1="4" y1="4" x2="20" y2="20"/></>
                ) : (
                  <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>
                )}
              </svg>
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link href="/auth/forgot" className="text-sm text-soft hover:underline">Lupa password?</Link>
          </div>

          {/* Gradient submit */}
          <button
            type="submit"
            disabled={loading || !validEmail}
            className="mt-5 w-full h-12 rounded-xl font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(90deg, rgb(56,189,248), rgb(59,130,246))",
              color: "#fff",
            }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {loading ? "Memproses..." : "Masuk"}
            </span>
          </button>

          <p className="mt-5 text-sm text-soft">
            Belum punya akun? {" "}
            <Link href="/auth/signup" className="text-blue-400 hover:underline">Daftar Sekarang</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

