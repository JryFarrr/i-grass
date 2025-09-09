"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-context";

type KeyRow = { subject: string; examType: string; uploaded: boolean; fileType?: 'pdf' | 'word' };

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

const SUBJECTS = ['Bahasa Indonesia','Matematika','Fisika','Biologi','Penulisan Ilmiah'];
const EXAMS = ['UTS','UAS','ETS','EAS'];
const CLASSES = ['A','B','C'];

export default function UploadBerkasPage(){
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  useEffect(()=>{ if(!loading && !user) router.replace('/auth/login'); },[loading,user,router]);

  const [fileKind, setFileKind] = useState<'kunci'|'jawaban'>('kunci');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [examType, setExamType] = useState(EXAMS[0]);
  const [kelas, setKelas] = useState(CLASSES[0]);
  const [student, setStudent] = useState(ALL_STUDENTS[0]);
  const inputRef = useRef<HTMLInputElement|null>(null);

  const [keyRows, setKeyRows] = useState<KeyRow[]>([
    { subject: 'Bahasa Indonesia', examType: 'ETS', uploaded: true, fileType: 'pdf' },
    { subject: 'Penulisan Ilmiah', examType: 'EAS', uploaded: false },
  ]);

  function onPick(){ inputRef.current?.click(); }
  function onFiles(files: FileList | null){
    if(!files || !files.length) return;
    const f = files[0];
    if (fileKind === 'kunci') {
      setKeyRows(prev => {
        const ext = f.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'word';
        const i = prev.findIndex(r => r.subject === subject && r.examType === examType);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], uploaded: true, fileType: ext as 'pdf'|'word' };
          return next;
        }
        return [...prev, { subject, examType, uploaded: true, fileType: ext as 'pdf'|'word' }];
      });
      alert('Kunci jawaban diupload (dummy).');
    } else {
      const msg = f.name.toLowerCase().endsWith('.zip') ? 'ZIP jawaban mahasiswa diupload (dummy).' : 'Berkas jawaban mahasiswa diupload (dummy).';
      alert(msg);
    }
  }

  const accept = useMemo(() => fileKind === 'kunci' ? '.pdf,.doc,.docx' : '.pdf,.doc,.docx,.zip', [fileKind]);

  if (!user) return null;

  return (
    <section className="px-6 md:px-10 pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="glass rounded-3xl p-5 lg:p-6 flex flex-col" style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.14), rgba(56,189,248,0.14))" }}>
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
            <Link className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link hover:nav-pill-active" href="/dashboard">
              <span className="inline-grid place-items-center w-5"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2Z"/></svg></span>
              Dashboard
            </Link>
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link hover:nav-pill-active" href="#">
              <span className="inline-grid place-items-center w-5"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v2H4zm0 7h16v2H4zm0 7h16v2H4z"/></svg></span>
              Visualisasi
            </a>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-xl nav-link nav-pill-active" href="/dashboard/upload">
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
          {/* Filters + uploader */}
          <div className="glass rounded-3xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Jenis file</label>
                <div className="relative">
                  <select value={fileKind} onChange={e=>setFileKind(e.target.value as any)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                    <option value="kunci">Kunci Jawaban</option>
                    <option value="jawaban">Jawaban Mahasiswa</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Mata Pelajaran</label>
                <div className="relative">
                  <select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Kelas</label>
                <div className="relative">
                  <select value={kelas} onChange={e=>setKelas(e.target.value)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                    {CLASSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Jenis Ujian</label>
                <div className="relative">
                  <select value={examType} onChange={e=>setExamType(e.target.value)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                    {EXAMS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Nama Mahasiswa</label>
                <div className="relative">
                  <select value={student} onChange={e=>setStudent(e.target.value)} className="w-full appearance-none rounded-xl bg-transparent border px-4 py-2.5 pr-9 outline-none focus:border-blue-500" style={{ borderColor: "var(--glass-border)" }}>
                    {ALL_STUDENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-70">▾</span>
                </div>
              </div>
              <div className="">
                <label className="block text-sm mb-2">Upload Berkas {fileKind === 'kunci' ? 'PDF/Word' : 'PDF/Word/ZIP'}</label>
                <div onClick={onPick} className="cursor-pointer glass rounded-2xl p-5 grid place-items-center h-[120px]">
                  <div className="text-center text-soft">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l4 4h-3v6h-2V7H8l4-4Zm-7 9v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7h-2v7H7v-7H5Z"/></svg>
                      <span>Click to upload</span>
                    </div>
                    <div className="text-xs">{fileKind === 'kunci' ? 'Format: .pdf, .doc, .docx' : 'Format: .pdf, .doc, .docx, .zip'}</div>
                  </div>
                </div>
                <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e)=>onFiles(e.target.files)} />
              </div>
            </div>
          </div>

          {/* Kunci Jawaban table */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Kunci Jawaban</h3>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left px-4 py-3">Mata Pelajaran</th>
                      <th className="text-left px-4 py-3">Jenis ujian</th>
                      <th className="text-left px-4 py-3">Berkas</th>
                      <th className="text-left px-4 py-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyRows.map((r,i)=> (
                      <tr key={i} className="border-t" style={{ borderColor: 'var(--glass-border)' }}>
                        <td className="px-4 py-2.5">{r.subject}</td>
                        <td className="px-4 py-2.5">{r.examType}</td>
                        <td className="px-4 py-2.5">
                          {r.uploaded ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg btn-glass">
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
                            </span>
                          ) : (
                            <span className="text-soft">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {r.uploaded ? <span className="text-green-400">Sudah diupload</span> : <span className="text-red-400">Belum diupload</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
