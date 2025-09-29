"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { useAuth } from "../../components/auth-context";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? "");
      setError(message || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center px-6">
      <div className="grid w-full max-w-5xl grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Visual panel */}
        <div
          className="hidden md:flex glass rounded-3xl p-8 md:p-10 flex-col justify-between"
          style={{
            background:
              "linear-gradient(180deg, rgba(56,189,248,0.14), rgba(255,255,255,0.04))",
            borderColor: "var(--glass-border)",
          }}
        >
          <div>
            <div className="badge-glass mb-4">Buat akun baru</div>
            <h1 className="text-3xl font-bold mb-2">i-GraS</h1>
            <p className="text-soft">Mulai perjalanan penilaian otomatis Anda.</p>
          </div>
          <ul className="text-sm text-soft list-disc pl-5 space-y-1">
            <li>Kelola kelas dan ujian</li>
            <li>Scoring cepat dan objektif</li>
            <li>Umpan balik terstruktur</li>
          </ul>
        </div>

        {/* Form panel */}
        <form onSubmit={onSubmit} className="glass rounded-3xl p-8 md:p-10">
          <h2 className="text-2xl font-semibold mb-6">Daftar</h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <label className="block text-sm mb-2">Nama lengkap</label>
          <input
            type="text"
            required
            value={name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
            className="w-full mb-4 rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
            style={{ borderColor: "var(--glass-border)" }}
            placeholder="Nama Anda"
          />

          <label className="block text-sm mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
            className="w-full mb-4 rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
            style={{ borderColor: "var(--glass-border)" }}
            placeholder="nama@domain.com"
          />

          <label className="block text-sm mb-2">Kata sandi</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
            className="w-full mb-6 rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
            style={{ borderColor: "var(--glass-border)" }}
            placeholder="Minimal 6 karakter"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-glass btn-glass--primary w-full flex items-center justify-center gap-2"
          >
            {loading ? "Memproses..." : "Buat Akun"}
          </button>

          <p className="mt-4 text-sm text-soft">
            Sudah punya akun? {" "}
            <Link href="/auth/login" className="text-blue-400 hover:underline">Masuk</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
