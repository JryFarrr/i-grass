"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth-context";

type ScoreRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  task_achievement_average: number;
  coherence_and_cohesion_average: number;
  lexical_resource_average: number;
  grammatical_range_average: number;
  overall_average: number;
  created_at: string;
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/exam");
    }
  }, [loading, user, router]);

  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    (async () => {
      try {
        setScoresLoading(true);
        const res = await fetch("/api/admin/scores");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memuat data");
        setScores(json.scores ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setScoresLoading(false);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scores;
    return scores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [scores, search]);

  const uniqueStudents = useMemo(
    () => new Set(scores.map((s) => s.user_id)).size,
    [scores]
  );
  const classAverage = useMemo(() => {
    if (!scores.length) return "-";
    const avg =
      scores.reduce((acc, s) => acc + s.overall_average, 0) / scores.length;
    return Math.round(avg * 2) / 2;
  }, [scores]);

  function formatDate(d: string) {
    return new Date(d).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function downloadCsv() {
    const headers = [
      "Nama",
      "Email",
      "Tanggal",
      "Task Achievement",
      "Coherence & Cohesion",
      "Lexical Resource",
      "Grammatical Range",
      "Band Keseluruhan",
    ];
    const rows = filtered.map((r) => [
      r.name,
      r.email,
      formatDate(r.created_at),
      r.task_achievement_average,
      r.coherence_and_cohesion_average,
      r.lexical_resource_average,
      r.grammatical_range_average,
      r.overall_average,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hasil-ielts-igras.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    const w = window.open("", "_blank");
    if (!w) return;
    const style = `body{font-family: system-ui, sans-serif} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px;text-align:left}`;
    const table = `
      <h2>Hasil Ujian IELTS — i-Grass</h2>
      <table>
        <thead>
          <tr><th>Nama</th><th>Email</th><th>Tanggal</th><th>TA</th><th>CC</th><th>LR</th><th>GR</th><th>Band</th></tr>
        </thead>
        <tbody>
        ${filtered
          .map(
            (r) =>
              `<tr><td>${r.name}</td><td>${r.email}</td><td>${formatDate(
                r.created_at
              )}</td><td>${r.task_achievement_average}</td><td>${
                r.coherence_and_cohesion_average
              }</td><td>${r.lexical_resource_average}</td><td>${
                r.grammatical_range_average
              }</td><td>${r.overall_average}</td></tr>`
          )
          .join("")}
        </tbody>
      </table>`;
    w.document.write(`<style>${style}</style>${table}`);
    w.document.close();
    w.focus();
    w.print();
  }

  if (loading || !user || user.role !== "admin") {
    return null;
  }

  return (
    <section className="px-6 md:px-10 pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside
          className="glass rounded-3xl p-5 lg:p-6 flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, rgba(59,130,246,0.14), rgba(56,189,248,0.14))",
          }}
        >
          <div
            className="flex items-center gap-4 pb-5 border-b"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div className="h-12 w-12 rounded-full bg-white/20 grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.84V22h16v-3.16C20 16.17 16.33 14 12 14Z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">{user?.name || "Pengguna"}</div>
              <div className="text-xs text-soft">{user?.email}</div>
            </div>
          </div>

          <nav className="mt-4 space-y-2 flex flex-col min-h-0">
            <Link
              className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link nav-pill-active"
              href="/dashboard"
            >
              <span className="inline-grid place-items-center w-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2Z" />
                </svg>
              </span>
              Dashboard
            </Link>
            <span className="flex-1" />
            <button
              onClick={logout}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl nav-link hover:nav-pill-active mt-auto"
            >
              <span className="inline-grid place-items-center w-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 17v2H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5v2H6v10zM14 7l5 5-5 5v-3h-4v-4h4z" />
                </svg>
              </span>
              Keluar
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 text-blue-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.84V22h16v-3.16C20 16.17 16.33 14 12 14Z" />
                </svg>
                <div className="text-sm">Jumlah Ujian</div>
              </div>
              <div className="mt-3 text-4xl font-bold">{scores.length}</div>
              <div className="mt-2 text-xs text-soft">Total esai yang sudah dinilai</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 text-blue-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
                </svg>
                <div className="text-sm">Siswa Unik</div>
              </div>
              <div className="mt-3 text-4xl font-bold">{uniqueStudents}</div>
              <div className="mt-2 text-xs text-soft">Siswa yang pernah ikut ujian</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 text-blue-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <div className="text-sm">Rata-rata Band</div>
              </div>
              <div className="mt-3 text-4xl font-bold">{classAverage}</div>
              <div className="mt-2 text-xs text-soft">Skala band IELTS 0–9</div>
            </div>
          </div>

          {/* Search + export */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-4 items-center">
            <div>
              <label className="block text-sm mb-2">Cari siswa</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama atau email siswa..."
                className="w-full rounded-xl bg-transparent border px-4 py-2.5 outline-none focus:border-blue-500"
                style={{ borderColor: "var(--glass-border)" }}
              />
            </div>
            <button onClick={printPdf} className="btn-glass flex items-center gap-2 h-11">
              <span className="text-red-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 9V2h12v7H6Zm0 9h12v4H6v-4Zm-4-7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v-4H7v4H6a3 3 0 0 1-3-3v-6Z" />
                </svg>
              </span>
              Download PDF
            </button>
            <button onClick={downloadCsv} className="btn-glass flex items-center gap-2 h-11">
              <span className="text-green-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 2h10l6 6v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm10 1v5h5" />
                </svg>
              </span>
              Download CSV
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left px-4 py-3">Nama</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Tanggal</th>
                    <th className="text-center px-4 py-3">TA</th>
                    <th className="text-center px-4 py-3">CC</th>
                    <th className="text-center px-4 py-3">LR</th>
                    <th className="text-center px-4 py-3">GR</th>
                    <th className="text-center px-4 py-3">Band</th>
                  </tr>
                </thead>
                <tbody>
                  {scoresLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-soft">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-soft">
                        Belum ada siswa yang menyelesaikan ujian.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t"
                        style={{ borderColor: "var(--glass-border)" }}
                      >
                        <td className="px-4 py-2.5">{r.name}</td>
                        <td className="px-4 py-2.5">{r.email}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-2.5 text-center">{r.task_achievement_average}</td>
                        <td className="px-4 py-2.5 text-center">{r.coherence_and_cohesion_average}</td>
                        <td className="px-4 py-2.5 text-center">{r.lexical_resource_average}</td>
                        <td className="px-4 py-2.5 text-center">{r.grammatical_range_average}</td>
                        <td className="px-4 py-2.5 text-center font-semibold">{r.overall_average}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
