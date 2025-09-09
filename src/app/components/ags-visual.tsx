"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function AGSVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [grading, setGrading] = useState(false);
  const timerRef = useRef<any>(null);

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

  return (
    <div ref={ref} className="relative min-h-[420px] h-[55vh] select-none">
      {/* IGrass logo hotspot triggers grading on hover (centered, responsive, offset via CSS vars) */}
      <LogoHotspot onTrigger={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setGrading(true);
        timerRef.current = setTimeout(() => setGrading(false), 2200);
      }} />

      {/* Jawaban essai to grade (boxes removed as requested) */}
      <ChipEssay index={0} grading={grading} style={{ left: 0, bottom: 20 }} />
      <ChipEssay index={1} grading={grading} style={{ left: 40, bottom: 90 }} />
      <ChipEssay index={2} grading={grading} style={{ left: 90, bottom: 10 }} />
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
    let delayT: any; let progI: any; let finalizeT: any; let resetT: any;
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
            clearInterval(progI);
          }
        }, 60);
        finalizeT = setTimeout(() => {
          setPhase("done");
        }, duration + 40);
      }, index * 250);
    } else {
      resetT = setTimeout(() => { setPhase("idle"); setProgress(0); }, 500);
    }
    return () => { clearTimeout(delayT); clearInterval(progI); clearTimeout(finalizeT); clearTimeout(resetT); };
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
