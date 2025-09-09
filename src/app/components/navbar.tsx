// src/app/components/navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

const items = [
  { href: "#home", label: "Beranda" },
  { href: "#blog", label: "Blog" },
  { href: "#projects", label: "Proyek" },
  { href: "#about", label: "Tentang" },
];

export default function Navbar() {
  const [active, setActive] = useState<string>('#home');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent){ if(!menuRef.current) return; if(!menuRef.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    const init = () => setActive(location.hash || '#home');
    init();
    const onHash = () => setActive(location.hash || '#home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Auth pages: render a simple top bar with logo + brand
  if (pathname === '/auth/login' || pathname?.startsWith('/dashboard')) {
    return (
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-3 flex items-center justify-between glass rounded-b-2xl">
          <Link href="/" className="nav-link text-[22px] md:text-2xl font-semibold tracking-wide">Igrass</Link>
          <span className="text-soft text-sm">Selamat Datang</span>
        </div>
      </header>
    );
  }

  return (
    <nav className="fixed top-6 inset-x-0 z-50 flex justify-center">
      <div className="glass rounded-3xl px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 text-base sm:text-[17px]">
        {items.map(it => (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setActive(it.href)}
            className={`px-3 py-1.5 rounded-lg nav-link ${active===it.href? 'nav-pill-active' : ''}`}
          >
            {it.label}
          </Link>
        ))}
        <span className="mx-2 h-6 w-px bg-white/10 hidden sm:inline-block" />
        <button className="px-3 py-1.5 rounded-lg nav-link">Lainnya &#9662;</button>
        <span className="mx-2 h-6 w-px bg-white/10 hidden sm:inline-block" />
        {user ? (
          <div className="relative" ref={menuRef}>
            <button onClick={()=>setOpen(v=>!v)} className="px-3 py-1.5 rounded-lg nav-link inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 4.84V22h16v-3.16C20 16.17 16.33 14 12 14Z"/></svg>
              <span className="hidden sm:inline">{user.name || user.email}</span>
              <span aria-hidden>▾</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 min-w-[180px] glass rounded-xl p-2">
                <button onClick={()=>{ setOpen(false); router.push('/dashboard'); }} className="w-full text-left px-3 py-2 rounded-lg nav-link hover:nav-pill-active flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>
                  Dashboard
                </button>
                <button onClick={()=>{ setOpen(false); logout(); router.push('/'); }} className="w-full text-left px-3 py-2 rounded-lg nav-link hover:nav-pill-active flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 17v2H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5v2H6v10zM14 7l5 5-5 5v-3h-4v-4h4z"/></svg>
                  Keluar
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/login" className="px-3 py-1.5 rounded-lg nav-link">Masuk</Link>
        )}
      </div>
    </nav>
  );
}
