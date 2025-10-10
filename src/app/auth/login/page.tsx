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
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
            style={{ borderColor: "var(--glass-border)" }}
            placeholder="Enter your password"
          />
          <div className="mt-2 text-right">
            <button type="button" className="text-sm text-soft hover:underline">Lupa password?</button>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2V6Zm0 6h20v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z"/></svg>
              {loading ? "Memproses..." : "Masuk dengan Email"}
            </span>
          </button>

          {/* Divider */}
          <div className="my-4 relative">
            <div className="h-px bg-white/10" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 px-3 text-soft bg-[var(--base-bg)]">or</span>
          </div>

          {/* Google sign in (demo) */}
          <GoogleButton />

          <p className="mt-5 text-sm text-soft">
            Belum punya akun? {" "}
            <Link href="/auth/signup" className="text-blue-400 hover:underline">Daftar Sekarang</Link>
          </p>
        </form>
      </div>
    </section>
  );
}

function GoogleButton() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const authenticated = await loginWithGoogle();
      router.push(getLandingPathForRole(authenticated.role));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-12 rounded-xl flex items-center justify-center gap-3 border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        borderColor: "color-mix(in oklab, var(--accent) 60%, var(--glass-border))",
        background: "color-mix(in oklab, var(--accent) 8%, transparent)",
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20" aria-hidden>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.197l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.552,5.047C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.094,5.565 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
      </svg>
      <span>{loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
    </button>
  );
}

