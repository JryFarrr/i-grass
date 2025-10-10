"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth-context";

type Row = { name: string; score?: number; feedback?: string; fileType: 'pdf' | 'word' };

const ALL_STUDENTS = [
  "Aisyah Putri",
  "Bagas Saputra",
  "Chandra Wijaya",
  "Dewi Lestari",
  "Eko Prasetyo",
  "Farah Nabila",
  "Gilang Ramadhan",
  "Hana Safitri",
  "Indra Kurniawan",
  "Jihan Fadila",
];

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

  const [subject, setSubject] = useState("Bahasa Indonesia");
  const [examType, setExamType] = useState("UTS");
  const [student, setStudent] = useState("Pilih semua siswa");
  const [data, setData] = useState<Row[]>(() =>
    ALL_STUDENTS.map((n, i) => ({ name: n, fileType: i % 2 === 0 ? 'pdf' : 'word' }))
  );
  const total = 50;
  const scored = 20;

  const filtered = useMemo(() => {
    if (student === "Pilih semua siswa") return data;
    return data.filter(r => r.name === student);
  }, [student, data]);

  // UI state for scoring effect
  const [isScoring, setIsScoring] = useState(false);

  function startScoring() {
    // Simulate scoring
    setData(prev => prev.map(row => ({
      ...row,
      score: Math.floor(60 + Math.random() * 41),
      feedback: Math.random() > 0.6 ? "Perlu elaborasi lebih jelas." : "Jawaban sudah cukup baik.",
    })));
  }

  function createRipple(e: MouseEvent<HTMLButtonElement>) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const circle = document.createElement('span');
    const d = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - d / 2;
    const y = e.clientY - rect.top - d / 2;
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.className = 'ripple';
    // cleanup old ripple if exists
    const prev = target.getElementsByClassName('ripple')[0];
    if (prev) prev.remove();
    target.appendChild(circle);
  }

  function handleStartClick(e: MouseEvent<HTMLButtonElement>) {
    if (isScoring) return;
    createRipple(e);
    setIsScoring(true);
    // give some time to play the effect
    setTimeout(() => {
      startScoring();
      setIsScoring(false);
    }, 1200);
  }

  function openFile(row: Row) {
    if (row.fileType === 'pdf') {
      openAnswerPdf(row);
    } else {
      downloadAnswerDoc(row);
    }
  }

  function openAnswerPdf(row: Row) {
    const w = window.open('', '_blank');
    if (!w) return;
    const style = `body{font-family: system-ui, sans-serif; padding: 32px; line-height:1.6} h1{margin:0 0 8px} h2{margin:24px 0 8px} .muted{color:#666}`;
    const html = `
      <h1>Jawaban Mahasiswa (Dummy)</h1>
      <div class="muted">Nama: ${row.name}</div>
      <div class="muted">Mata Pelajaran: ${subject} — Jenis Ujian: ${examType}</div>
      <h2>Pertanyaan</h2>
      <p>Sebutkan dan jelaskan 3 faktor yang memengaruhi kualitas tulisan esai.</p>
      <h2>Jawaban</h2>
      <p>Ini merupakan berkas dummy untuk demonstrasi. Konten ini meniru jawaban mahasiswa dalam bentuk paragraf yang dapat dicetak atau disimpan sebagai PDF melalui dialog print pada browser.</p>
      <p>Paragraf kedua menjelaskan argumentasi dan contoh yang relevan. Tambahkan beberapa kalimat agar terlihat seperti esai.</p>
    `;
    w.document.write(`<style>${style}</style>${html}`);
    w.document.close();
    w.focus();
    // Biarkan pengguna memilih "Save as PDF" dari dialog print jika diinginkan
    setTimeout(() => w.print(), 200);
  }

  function downloadAnswerDoc(row: Row) {
    const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Jawaban ${row.name}</title></head><body><h1>Jawaban Mahasiswa (Dummy)</h1><p>Nama: ${row.name}</p><p>Mata Pelajaran: ${subject} — Jenis Ujian: ${examType}</p><p>Ini adalah dokumen Word dummy untuk demonstrasi. Silakan gunakan untuk pengujian UI.</p></body></html>`;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jawaban-${row.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    const headers = ["Nama", "Skor", "Feedback"]; 
    const rows = filtered.map(r => [r.name, r.score ?? "", r.feedback ?? ""]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hasil-igras.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    const w = window.open('', '_blank');
    if (!w) return;
    const style = `body{font-family: system-ui, sans-serif} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px;text-align:left}`;
    const table = `
      <h2>Hasil Scoring - ${subject} (${examType})</h2>
      <table>
        <thead><tr><th>Nama</th><th>Skor</th><th>Feedback</th></tr></thead>
        <tbody>
        ${filtered.map(r => `<tr><td>${r.name}</td><td>${r.score ?? ''}</td><td>${r.feedback ?? ''}</td></tr>`).join('')}
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
          <div className="flex items-center gap-4 pb-5 border-b" style={{ borderColor: "var(--glass-border)" }}>
            <div className="h-12 w-12 rounded-full bg-white/20 grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.84V22h16v-3.16C20 16.17 16.33 14 12 14Z"/></svg>
            </div>
            <div>
              <div className="font-semibold">{user?.name || "Pengguna"}</div>
              <div className="text-xs text-soft">{user?.email}</div>
            </div>
          </div>

          <nav className="mt-4 space-y-2 flex flex-col min-h-0">
            <Link className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link nav-pill-active" href="/dashboard">
              <span className="inline-grid place-items-center w-5"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2Z"/></svg></span>
              Dashboard
            </Link>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link hover:nav-pill-active" href="#">
              <span className="inline-grid place-items-center w-5"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4zm0 7h16v2H4zm0 7h16v2H4z"/></svg></span>
              Visualisasi
            </a>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link hover:nav-pill-active" href="/dashboard/upload">
              <span className="inline-grid place-items-center w-5"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l4 4h-3v6h-2V7H8l4-4Zm-7 9v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v7H7v-7H5Z"/></svg></span>
              Upload berkas
            </Link>
            <span className="flex-1" />
            <button onClick={logout} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl nav-link hover:nav-pill-active mt-auto">
              <span className="inline-grid place-items-center w-5"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 17v2H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5v2H6v10zM14 7l5 5-5 5v-3h-4v-4h4z"/></svg></span>
              Keluar
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 text-blue-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.84V22h16v-3.16C20 16.17 16.33 14 12 14Z"/></svg>
                <div className="text-sm">Jumlah Siswa</div>
              </div>
              <div className="mt-3 text-4xl font-bold">{total}</div>
              <div className="mt-2 text-xs text-soft">95% Mengikuti ujian</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 text-blue-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5h-2v6h6v-2h-4z"/></svg>
                <div className="text-sm">Yang sudah discoring</div>
              </div>
              <div className="mt-3 text-4xl font-bold">{scored}</div>
              <div className="mt-2 text-xs text-soft">80% Sudah dinilai</div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm mb-2">Pilih mata pelajaran</label>
              <div className="relative">
                <select value={subject} onChange={(e)=>setSubject(e.target.value)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                  {['Bahasa Indonesia','Matematika','Fisika','Biologi'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Pilih jenis ujian</label>
              <div className="relative">
                <select value={examType} onChange={(e)=>setExamType(e.target.value)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                  {['UTS','UAS','Kuis','Tugas'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2">Pilih Mahasiswa</label>
              <div className="relative">
                <select value={student} onChange={(e)=>setStudent(e.target.value)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                  <option>Pilih semua siswa</option>
                  {ALL_STUDENTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
              </div>
            </div>
            <button
              onClick={handleStartClick}
              disabled={isScoring}
              className="relative overflow-hidden h-11 rounded-xl px-5 whitespace-nowrap font-semibold shadow btn-ripple"
              style={{
                background: "linear-gradient(90deg, rgb(56,189,248), rgb(59,130,246))",
                color: "#ffffff",
                border: 'none',
              }}
            >
              {isScoring ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" opacity=".25" strokeWidth="4"/><path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
                  Memproses...
                </span>
              ) : (
                'Mulai Scoring Otomatis'
              )}
            </button>
          </div>

          {/* Table */}
            <div className="glass rounded-2xl overflow-hidden relative">
              <div className={"scanline " + (isScoring ? 'active' : '')} />
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                    <th className="text-left px-4 py-3">Nama</th>
                    <th className="text-left px-4 py-3">Skor</th>
                    <th className="text-left px-4 py-3">Feedback</th>
                    <th className="text-left px-4 py-3">Berkas</th>
                    </tr>
                  </thead>
                  <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                      <td className="px-4 py-2.5">{r.name}</td>
                      <td className="px-4 py-2.5">{r.score ?? '-'}</td>
                      <td className="px-4 py-2.5">{r.feedback ?? '-'}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={()=>openFile(r)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg btn-glass">
                          {r.fileType === 'pdf' ? (
                            <>
                              <span className="text-red-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 9V2h12v7H6Zm0 9h12v4H6v-4Zm-4-7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v-4H7v4H6a3 3 0 0 1-3-3v-6Z"/></svg></span>
                              <span>PDF</span>
                            </>
                          ) : (
                            <>
                              <span className="text-blue-300"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 2h10l6 6v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm10 1v5h5"/></svg></span>
                              <span>Word</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Downloads */}
          <div className="flex items-center gap-4">
            <button onClick={printPdf} className="btn-glass flex items-center gap-2">
              <span className="text-red-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 9V2h12v7H6Zm0 9h12v4H6v-4Zm-4-7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v-4H7v4H6a3 3 0 0 1-3-3v-6Z"/></svg>
              </span>
              Download PDF
            </button>
            <button onClick={downloadCsv} className="btn-glass flex items-center gap-2">
              <span className="text-green-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 2h10l6 6v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm10 1v5h5"/></svg>
              </span>
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
