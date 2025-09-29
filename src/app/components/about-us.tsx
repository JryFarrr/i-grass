"use client";

import Image from "next/image";
import { useState } from "react";

type Member = {
  name: string;
  role?: string; // optional role shown on hover
  img: string; // path under /public
  scale?: number; // scale up to match visual size
  y?: number; // optional vertical nudge
};

const members: Member[] = [
  { name: "Triwanto", role: "Chief Executive Officer", img: "/team/triwanto.png", scale: 1.42 },
  { name: "Jiryan Farokhi", role: "Chief Technology Officer", img: "/team/jiryan-farokhi.png", scale: 1.50 },
  { name: "Zhana Nur Asmi Q.", role: "Chief Finance Officer", img: "/team/zhana-nur-asmi-q.png", scale: 1.00 },
  { name: "Adifa Naila", role: "Chief Marketing Officer", img: "/team/adifa-naila.png", scale: 1.60 },
];

function TeamCard({ m, index, delay }: { m: Member; index: number; delay: number }) {
  const [fallback, setFallback] = useState(false);
  return (
    <div
      className="skew-card group relative hero-rise"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="skew-card-inner">
        <div className="relative h-full w-full">
          {fallback ? (
            <div className="absolute inset-0 grid place-items-center text-soft">
              <div
                className="w-28 h-28 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 40% 35%, rgba(56,189,248,.25), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.0))",
                  border: "1px solid var(--glass-border)",
                }}
              />
            </div>
          ) : (
            <div className="portrait-box">
              <Image
                src={m.img}
                alt={m.name}
                fill
                sizes="(min-width: 1280px) 520px, (min-width: 640px) 420px, 320px"
                className="object-contain object-bottom drop-shadow-xl transition-opacity duration-300 group-hover:opacity-0"
                onError={() => setFallback(true)}
                priority={index < 2}
                style={{ transform: `translateY(${m.y ?? 0}px) scale(${m.scale ?? 1})`, transformOrigin: "bottom center" }}
              />
            </div>
          )}
          {/* Role overlay shown on hover (image fades out) */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="about-role text-center text-2xl md:text-4xl font-extrabold px-4">
              {m.role ?? m.name}
            </div>
          </div>
        </div>

        {/* Name label centered by the rectangle card */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 text-center flex justify-center">
          <div className="about-name tracking-tight">{m.name}</div>
        </div>
      </div>
    </div>
  );
}

export default function AboutUs() {
  const display = members.length >= 4 ? members.slice(0, 4) : [...members, ...members].slice(0, 4);

  return (
    <section id="about" className="relative py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 hero-rise">About Us</h2>
        <p className="text-soft text-center max-w-3xl mx-auto mb-10 md:mb-12 hero-rise hero-rise-delay-sm">
          Tim I-Gras terdiri dari mahasiswa Matematika ITS angkatan 2022 dan sebagai asisten
          laboratorium Pembelajaran Machine Learning dan Big Data
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {display.map((m, i) => (
            <TeamCard key={`${m.name}-${i}`} m={m} index={i} delay={0.2 + i * 0.14} />
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[.18]"
        style={{
          background:
            "repeating-radial-gradient( circle at 10% 10%, var(--grid), var(--grid) 1px, transparent 1px, transparent 80px )",
        }}
      />
    </section>
  );
}
