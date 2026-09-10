"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal reset password");
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="relative min-h-[80vh] flex items-center justify-center px-6">
        <div className="glass rounded-3xl p-8 md:p-10 w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-3">Tautan tidak valid</h2>
          <p className="text-soft text-sm mb-4">Tautan reset tidak ditemukan atau sudah kedaluwarsa.</p>
          <Link href="/auth/forgot" className="text-blue-400 hover:underline text-sm">Minta tautan baru</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="glass rounded-3xl p-8 md:p-10 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Atur Password Baru</h2>

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {done && (
          <div className="mb-4 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-3 text-sm">
            Password berhasil diatur ulang. Mengalihkan ke halaman login...
          </div>
        )}

        <label className="block text-sm mb-2">Password baru</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-transparent border px-4 py-2.5 pr-11 outline-none focus:border-blue-500"
            style={{ borderColor: "var(--glass-border)" }}
            placeholder="Minimal 6 karakter"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {show ? (
                <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><line x1="4" y1="4" x2="20" y2="20"/></>
              ) : (
                <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>
              )}
            </svg>
          </button>
        </div>

        <label className="block text-sm mt-4 mb-2">Konfirmasi password baru</label>
        <input
          type="text"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
          style={{ borderColor: "var(--glass-border)" }}
          placeholder="Ulangi password baru"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full h-12 rounded-xl font-semibold shadow-md disabled:opacity-60"
          style={{ background: "linear-gradient(90deg, rgb(56,189,248), rgb(59,130,246))", color: "#fff" }}
        >
          {loading ? "Memproses..." : "Simpan Password Baru"}
        </button>
      </form>
    </section>
  );
}
