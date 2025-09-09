"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
type ThemePref = Theme | "system";

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("dark");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const getCookie = (name: string) => {
        const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[-.]/g, "\\$&") + "=([^;]+)"));
        return m ? decodeURIComponent(m[1]) : "";
      };
      const cookiePref = (getCookie("themePref") as ThemePref) || "";
      const cookieTheme = (getCookie("theme") as Theme) || "";
      const savedPref = cookiePref || (localStorage.getItem("themePref") as ThemePref) || (localStorage.getItem("theme") as ThemePref) || "dark";
      setPref(savedPref);
      const applied = (cookieTheme as Theme) || resolveTheme(savedPref);
      setTheme(applied);
      applyTheme(applied);
      // Listen system changes when pref is system
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
  }, []);

  // Keep a ref of pref for listener
  const prefRef = { current: pref } as { current: ThemePref };
  useEffect(() => { prefRef.current = pref; }, [pref]);

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

    // Cycle: dark -> light -> system -> dark
    const nextPref: ThemePref = pref === "dark" ? "light" : pref === "light" ? "system" : "dark";
    setPref(nextPref);
    try { localStorage.setItem("themePref", nextPref); } catch {}
    const nextTheme = resolveTheme(nextPref);
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setCookies(nextPref, nextTheme);

    // Remove overlay after animation
    setTimeout(() => {
      overlay.remove();
    }, 260);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed left-4 bottom-4 z-50 glass w-12 h-12 rounded-full text-white flex items-center justify-center hover:opacity-90"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      <span className="text-lg" role="img" aria-hidden>
        {pref === "system" ? "💻" : theme === "dark" ? "☀" : "🌙"}
      </span>
    </button>
  );
}
