"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";
type ThemePref = Theme | "system";

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("dark");
  const [theme, setTheme] = useState<Theme>("dark");
  // Keep a ref of pref for the matchMedia listener
  const prefRef = useRef<ThemePref>(pref);
  useEffect(() => { prefRef.current = pref; }, [pref]);

  useEffect(() => {
    try {
      const getCookie = (name: string) => {
        const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[-.]/g, "\\$&") + "=([^;]+)"));
        return m ? decodeURIComponent(m[1]) : "";
      };
      const cookiePref = (getCookie("themePref") as ThemePref) || "";
      const cookieTheme = (getCookie("theme") as Theme) || "";
      const savedPref = (cookiePref || (localStorage.getItem("themePref") as ThemePref) || (localStorage.getItem("theme") as ThemePref) || "dark") as ThemePref;
      setPref(savedPref);
      const applied = (cookieTheme as Theme) || resolveTheme(savedPref);
      setTheme(applied);
      applyTheme(applied);
      // Listen system changes when pref is system (backward compatibility only)
      const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (prefRef.current === "system") {
          const t = mq.matches ? "dark" : "light";
          setTheme(t);
          applyTheme(t);
          setCookies("system", t);
        }
      };
      if (mq) mq.addEventListener?.("change", onChange);
      return () => { if (mq) mq.removeEventListener?.("change", onChange); };
    } catch {}
  }, [prefRef]);

  function resolveTheme(p: ThemePref): Theme {
    if (p === "system") {
      const m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return m ? "dark" : "light";
    }
    return p;
  }

  function applyTheme(next: Theme) {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(next === "dark" ? "theme-dark" : "theme-light");
  }

  function setCookies(pref: ThemePref, resolved: Theme) {
    const attrs = `; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax` + (location.protocol === 'https:' ? '; Secure' : '');
    document.cookie = `themePref=${encodeURIComponent(pref)}${attrs}`;
    document.cookie = `theme=${encodeURIComponent(resolved)}${attrs}`;
  }

  function toggle() {
    // Add a transient overlay for smoother feel
    const overlay = document.createElement("div");
    overlay.className = "theme-fade-overlay";
    document.body.appendChild(overlay);

    // Toggle only dark <-> light (remove system option)
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setPref(nextTheme);
    try { localStorage.setItem("themePref", nextTheme); } catch {}
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setCookies(nextTheme, nextTheme);

    setTimeout(() => overlay.remove(), 260);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed left-4 bottom-4 z-50 glass w-12 h-12 rounded-full text-white flex items-center justify-center hover:opacity-90"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? (
        // Sun icon (switch to light)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M6.76 4.84 4.96 3.05 3.55 4.46l1.79 1.79 1.42-1.41Zm10.48 0 1.41-1.41 1.79 1.79-1.41 1.41-1.79-1.79ZM12 4V1h0v3h0Zm0 19v-3h0v3h0ZM4 12H1v0h3v0Zm19 0h-3v0h3v0ZM6.76 19.16l-1.42 1.41-1.79-1.79 1.42-1.41 1.79 1.79Zm10.48 0 1.79 1.79 1.41-1.41-1.79-1.79-1.41 1.41ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
        </svg>
      ) : (
        // Moon icon (switch to dark)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
