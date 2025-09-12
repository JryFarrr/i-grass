"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function AGSVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [grading, setGrading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spots, setSpots] = useState<{ left: number; top: number }[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--mx", (x * 16).toFixed(2) + "px");
      el.style.setProperty("--my", (y * 16).toFixed(2) + "px");
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
    };
  }, []);

  // Generate random non-overlapping spots for 5 chips inside container
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const gen = () => {
      const rect = root.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const pad = 16; // padding from edges
      const minDist = 120; // min distance between chips (px)
      const CHIP_W = 140; // approximate chip size for collision checks
      const CHIP_H = 32;

      // Measure the logo hotspot rect (avoid placing chips on top of it)
      const logo = document.getElementById('logo-hotspot');
      let avoid: { left: number; top: number; right: number; bottom: number } | null = null;
      if (logo) {
        const lr = logo.getBoundingClientRect();
        avoid = {
          left: Math.max(0, lr.left - rect.left) - 12,
          top: Math.max(0, lr.top - rect.top) - 12,
          right: Math.min(W, lr.right - rect.left) + 12,
          bottom: Math.min(H, lr.bottom - rect.top) + 12,
        };
      }
      const pts: { left: number; top: number }[] = [];

      function ok(x: number, y: number) {
        // keep inside bounds
        if (x < pad || x > W - pad - CHIP_W) return false;
        if (y < pad || y > H - pad - CHIP_H) return false;
        // avoid the logo rectangle area
        if (avoid) {
          const r1 = { left: x, top: y, right: x + CHIP_W, bottom: y + CHIP_H };
          const overlap = !(r1.right < avoid.left || r1.left > avoid.right || r1.bottom < avoid.top || r1.top > avoid.bottom);
          if (overlap) return false;
        }
        // keep distance from others
        for (const p of pts) {
          if (Math.hypot((x + CHIP_W/2) - (p.left + CHIP_W/2), (y + CHIP_H/2) - (p.top + CHIP_H/2)) < minDist) return false;
        }
        return true;
      }

      for (let i = 0; i < 5; i++) {
        let placed = false;
        for (let t = 0; t < 200 && !placed; t++) {
          // bias to lower-right slightly for aesthetics
          const x = pad + Math.random() * (W - pad * 2 - CHIP_W);
          const y = pad + Math.random() * (H - pad * 2 - CHIP_H);
          if (ok(x, y)) {
            pts.push({ left: Math.round(x), top: Math.round(y) });
            placed = true;
          }
        }
        if (!placed) {
          // fallback: stack along bottom-left with spacing
          pts.push({ left: pad + i * 110, top: Math.max(pad, H - pad - CHIP_H) });
        }
      }
      setSpots(pts);
    };

    gen();
    const onResize = () => gen();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div ref={ref} className="relative min-h-[420px] h-[55vh] select-none">
      {/* IGrass logo hotspot triggers grading on hover (centered, responsive, offset via CSS vars) */}
      <LogoHotspot onTrigger={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setGrading(true);
        timerRef.current = setTimeout(() => setGrading(false), 2200);
      }} />

      {/* Jawaban essai (5 chips) dengan posisi acak non-overlap */}
      {spots.map((p, i) => (
        <ChipEssay key={i} index={i} grading={grading} style={{ left: p.left, top: p.top }} />
      ))}
    </div>
  );
}

function ChipEssay({ index, grading, style }: { index: number; grading: boolean; style: React.CSSProperties }) {
  const [score, setScore] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [phase, setPhase] = useState<"idle" | "grading" | "done">("idle");
  const [progress, setProgress] = useState(0);

  // Drive per-chip grading sequence with small delays per index
  useEffect(() => {
    let delayT: ReturnType<typeof setTimeout> | undefined;
    let progI: ReturnType<typeof setInterval> | undefined;
    let finalizeT: ReturnType<typeof setTimeout> | undefined;
    let resetT: ReturnType<typeof setTimeout> | undefined;
    if (grading) {
      delayT = setTimeout(() => {
        setPhase("grading");
        setProgress(0);
        const s = Math.floor(60 + Math.random() * 41); // 60..100
        setScore(s);
        const start = Date.now();
        const duration = 1200;
        progI = setInterval(() => {
          const p = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
          setProgress(p);
          if (p >= 100) {
            if (progI !== undefined) clearInterval(progI);
          }
        }, 60);
        finalizeT = setTimeout(() => {
          setPhase("done");
        }, duration + 40);
      }, index * 250);
    } else {
      resetT = setTimeout(() => { setPhase("idle"); setProgress(0); }, 500);
    }
    return () => {
      if (delayT !== undefined) clearTimeout(delayT);
      if (progI !== undefined) clearInterval(progI);
      if (finalizeT !== undefined) clearTimeout(finalizeT);
      if (resetT !== undefined) clearTimeout(resetT);
    };
  }, [grading, index]);

  const onEnter = () => setHovered(true);
  const onLeave = () => setHovered(false);

  const showScore = ((hovered || phase === "done") && score !== null);

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`chip-paper glass`}
      style={{
        ...(style || {}),
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V8h4.5" />
      </svg>
      <span>Jawaban essai</span>
      {showScore && (
        <span className="chip-score" aria-live="polite">Skor: {score}</span>
      )}
      {/* Blue check appears when grading is done */}
      <span className="chip-check" aria-hidden style={{ display: phase === "done" ? "inline-flex" : "none" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6 9 17l-5-5 1.5-1.5L9 14l9.5-9.5L20 6Z"/></svg>
      </span>
      {/* Progress bar representing automated grading */}
      {phase !== "idle" && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 8,
            bottom: -6,
            height: 3,
            width: `${progress}%`,
            background: 'var(--accent)',
            borderRadius: 9999,
            boxShadow: '0 0 10px rgba(59,130,246,0.7)',
            transition: 'width .08s linear',
          }}
        />
      )}
    </div>
  );
}

function LogoHotspot({ onTrigger }: { onTrigger: () => void }) {
  const [fallback, setFallback] = useState(false);
  // Use your own file: detected my-project/public/logo-igrass.svg
  const src = "/logo-igras"; // must start with '/' to load from /public
  return (
    <div
      className="logo-hotspot absolute left-1/2 top-1/2 grid place-items-center cursor-pointer text-blue-400 parallax glass rounded-[28px] sm:rounded-[32px]"
      style={{
        transform:
          "translate(-50%, -50%) translate3d(calc(var(--mx, 0px) * 0.6), calc(var(--my, 0px) * 0.6), 0)",
        width: 'clamp(240px, 48vh, 560px)',
        height: 'clamp(240px, 48vh, 560px)'
      }}
      onMouseEnter={onTrigger}
      title="Mulai penilaian"
      aria-label="Mulai penilaian"
    >
      <div className="relative w-full h-full" role="img" aria-label="Logo I-GraS">
        {fallback ? (
          <svg viewBox="0 0 48 48" aria-hidden className="w-full h-full">
            <circle cx="33" cy="9.5" r="3.2" fill="currentColor" />
            <path d="M16 10c1.8-1.4 4.5-1 5.9.8l6.6 8.6-6 4.6-6.5-8.6C14.6 14.2 14.9 11.3 16 10Z" fill="currentColor"/>
            <path d="M36 28 21.7 38.6c-.4.3-.9.5-1.3.6l-6.7 1.2 2.2-6.4c.2-.5.5-1 .9-1.3L31 21l5 7Z" fill="currentColor"/>
          </svg>
        ) : (
          <Image
            src={src}
            alt="Logo I-GraS"
            fill
            sizes="(min-width: 1280px) 560px, (min-width: 1024px) 520px, (min-width: 768px) 480px, 320px"
            className="object-contain bg-transparent"
            priority
            onError={() => setFallback(true)}
          />
        )}
      </div>
    </div>
  );
}
