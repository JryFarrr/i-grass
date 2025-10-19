"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../components/auth-context";

const IELTS_CHARACTERISTICS = [
  { key: "taskAchievement", label: "Task Achievement" },
  { key: "coherenceAndCohesion", label: "Coherence & Cohesion" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammatical Range" },
] as const;

function normalizeBandScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(9, value));
  return Math.round(clamped * 2) / 2;
}

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatDurationVerbose(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0 detik";
  }
  const parts: string[] = [];
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) parts.push(`${hrs} jam`);
  if (mins > 0) parts.push(`${mins} menit`);
  if (secs > 0) parts.push(`${secs} detik`);
  return parts.join(" ");
}

export default function ExamScorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
    } else if (user.role === "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const metrics = useMemo(() => {
    const getNumber = (key: string, fallback = 0) => {
      const raw = searchParams.get(key);
      if (!raw) return fallback;
      const value = Number.parseInt(raw, 10);
      return Number.isFinite(value) ? value : fallback;
    };
    const getDecimal = (key: string) => {
      const raw = searchParams.get(key);
      if (!raw) return Number.NaN;
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? value : Number.NaN;
    };

    const total = Math.max(0, getNumber("total", 0));
    const attempted = Math.min(total, Math.max(0, getNumber("attempted", 0)));
    const maxScore = Math.max(0, getNumber("maxScore", total * 10));
    const score = Math.max(0, Math.min(maxScore || attempted * 10, getNumber("score", attempted * 10)));
    const percentageDefault = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const percentage = Math.max(0, Math.min(100, getNumber("percentage", percentageDefault)));
    const duration = Math.max(0, getNumber("duration", 60 * 60));
    const timeTaken = Math.min(duration, Math.max(0, getNumber("timeTaken", 0)));
    const remainingSeconds = Math.max(0, duration - timeTaken);
    const baseBand = normalizeBandScore((percentage / 100) * 9);
    const parseBand = (key: string) => {
      const value = getDecimal(key);
      return Number.isFinite(value) ? normalizeBandScore(value) : baseBand;
    };

    const bandScores: Record<(typeof IELTS_CHARACTERISTICS)[number]["key"], number> = {
      taskAchievement: parseBand("ta"),
      coherenceAndCohesion: parseBand("cc"),
      lexicalResource: parseBand("lr"),
      grammaticalRange: parseBand("gr"),
    };
    const storedAverage = getDecimal("band");
    const derivedAverage =
      (bandScores.taskAchievement +
        bandScores.coherenceAndCohesion +
        bandScores.lexicalResource +
        bandScores.grammaticalRange) /
      4;
    const overallBand = Number.isFinite(storedAverage)
      ? normalizeBandScore(storedAverage)
      : normalizeBandScore(derivedAverage);

    return {
      total,
      attempted,
      score,
      maxScore,
      percentage,
      duration,
      timeTaken,
      remainingSeconds,
      bandScores,
      overallBand,
    };
  }, [searchParams]);

  if (loading || !user || user.role === "admin") {
    return null;
  }
  const accuracy = metrics.total > 0 ? Math.round((metrics.attempted / metrics.total) * 100) : 0;
  const firstName = user.name?.split(" ")?.[0] ?? "Peserta";
  const progressWidth = `${Math.min(100, Math.max(0, metrics.percentage))}%`;

  const stats = [
    {
      label: "Soal Dikerjakan",
      value: `${metrics.attempted}`,
      helper: `dari ${metrics.total} soal`,
    },
    {
      label: "Akurasi Jawaban",
      value: `${Math.min(100, Math.max(0, accuracy))}%`,
      helper: `${metrics.attempted}/${metrics.total} soal terjawab`,
    },
    {
      label: "Waktu Terpakai",
      value: formatClock(metrics.timeTaken),
      helper: formatDurationVerbose(metrics.timeTaken),
    },
    {
      label: "Sisa Waktu",
      value: formatClock(metrics.remainingSeconds),
      helper: formatDurationVerbose(metrics.remainingSeconds),
    },
  ];
  const characteristicEntries = IELTS_CHARACTERISTICS.map(({ key, label }) => ({
    key,
    label,
    score: metrics.bandScores[key],
  }));

  return (
    <section className="relative min-h-screen bg-slate-100 px-4 pb-12 pt-8">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.12)]">
          <header className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-8 py-10 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-100">Hasil Penilaian</p>
            <h1 className="mt-3 text-3xl font-semibold">Selamat, {firstName}!</h1>
            <p className="mt-4 max-w-2xl text-sm text-blue-100">
              Ujian kamu sudah diserahkan. Berikut ringkasan capaian dan skor karakteristik penilaian IELTS simulasi.
            </p>
          </header>

          <div className="space-y-10 px-8 pb-10 pt-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-blue-100 bg-blue-50/80 p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Skor</p>
                    <p className="mt-3 text-5xl font-bold text-blue-900">{metrics.score}</p>
                    <p className="text-sm text-blue-600">
                      dari {metrics.maxScore} poin | {metrics.percentage}% tercapai
                    </p>
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-200 bg-white text-xl font-semibold text-blue-700 shadow-inner">
                    {metrics.percentage}%
                  </div>
                </div>
                <div className="mt-6">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: progressWidth }} />
                  </div>
                  <p className="mt-2 text-xs text-blue-600">
                    Target minimal 70% {metrics.percentage >= 70 ? "sudah" : "belum"} tercapai.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-500 via-purple-500/90 to-indigo-600 p-6 text-white shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">Skor Karakteristik</p>
                <p className="mt-3 text-3xl font-semibold">Band {metrics.overallBand.toFixed(1)}</p>
                <p className="mt-4 text-sm text-white/80">
                  Rata-rata dari empat karakteristik utama penilaian IELTS Writing Task.
                </p>
                <div className="mt-6 space-y-4">
                  {characteristicEntries.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">{item.label}</span>
                        <span className="font-semibold text-white">{item.score.toFixed(1)}</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${Math.min(100, Math.max(0, (item.score / 9) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-sm">
              <p className="text-sm font-semibold text-white">Catatan Kemajuan</p>
              <p className="mt-4 text-sm text-slate-200">
                Gunakan skor karakteristik sebagai panduan fokus latihan. Prioritaskan aspek dengan band terendah,
                lalu perkuat dengan latihan terstruktur dan umpan balik mentor agar rata-rata band semakin naik.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-slate-200"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
