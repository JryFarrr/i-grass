"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setDevLink(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses");
      setDone(json.message || "Jika email terdaftar, tautan reset dikirim.");
      if (json.devLink) setDevLink(json.devLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="glass rounded-3xl p-8 md:p-10 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Lupa Password</h2>

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {done && (
          <div className="mb-4 rounded-xl border border-green-400/40 bg-green-500/10 px-4 py-3 text-sm">
            {done}
            {devLink && (
              <p className="mt-2 break-all">
                <Link href={devLink} className="text-blue-400 hover:underline">{devLink}</Link>
              </p>
            )}
          </div>
        )}

        <label className="block text-sm mb-2">Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
          style={{ borderColor: "var(--glass-border)" }}
          placeholder="Email yang terdaftar"
        />

        <button
          type="submit"
          disabled={loading || !email}
          className="mt-5 w-full h-12 rounded-xl font-semibold shadow-md disabled:opacity-60"
          style={{ background: "linear-gradient(90deg, rgb(56,189,248), rgb(59,130,246))", color: "#fff" }}
        >
          {loading ? "Memproses..." : "Kirim Tautan Reset"}
        </button>

        <p className="mt-4 text-sm text-soft">
          Sudah ingat password? {" "}
          <Link href="/auth/login" className="text-blue-400 hover:underline">Masuk</Link>
        </p>
      </form>
    </section>
  );
}
