import AGSVisual from './components/ags-visual';

export default function Home() {
  return (
    <section id="home" className="relative min-h-[85vh] flex items-center">
      {/* Decorative gradients: bring back colorful glows */}
      {/* Left glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-16rem] -top-24 -z-10 h-[760px] w-[760px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "conic-gradient(from 120deg at 50% 50%, #0b1220 0deg, #38bdf8 110deg, #3b82f6 220deg, #0b1220 360deg)",
        }}
      />
      {/* Right glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-14rem] top-10 -z-10 h-[700px] w-[700px] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, #0b1220 0deg, #3b82f6 120deg, #38bdf8 240deg, #0b1220 360deg)",
        }}
      />

      {/* Content container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Text */}
          <div>
            <div className="badge-glass mb-6">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_12px_2px_rgba(59,130,246,0.8)]" />
              <span>Laboratorium Machine Learning dan Big Data</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">i-Gras</h1>
            <p className="text-soft text-lg leading-relaxed max-w-xl mb-10">
              Penilaian Cerdas untuk Pembelajaran Efektif melalui Automated Grading System yang mampu memberikan evaluasi objektif, cepat, dan adaptif, sehingga memudahkan pendidik dalam menilai hasil belajar sekaligus membantu peserta didik mendapatkan umpan balik yang tepat waktu untuk meningkatkan kualitas pembelajaran.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-glass btn-glass--primary flex items-center gap-2">
                <span>Learn How</span>
                <span className="text-soft">&darr;</span>
              </button>
              <button className="btn-glass">More about Us</button>
            </div>

            {/* Social icons */}
            <div className="mt-8 flex items-center gap-5 text-soft">
              <a aria-label="GitHub" className="hover:text-white" href="#">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.589 2 12.253c0 4.515 2.865 8.34 6.839 9.695.5.094.682-.223.682-.498 0-.246-.009-.897-.014-1.76-2.782.617-3.369-1.37-3.369-1.37-.454-1.175-1.11-1.488-1.11-1.488-.907-.637.069-.624.069-.624 1.002.072 1.53 1.05 1.53 1.05.892 1.56 2.341 1.11 2.91.849.091-.662.35-1.11.636-1.366-2.22-.258-4.555-1.137-4.555-5.06 0-1.118.39-2.03 1.029-2.746-.103-.257-.446-1.296.098-2.701 0 0 .84-.273 2.75 1.048A9.32 9.32 0 0 1 12 6.844c.85.004 1.705.116 2.504.34 1.909-1.321 2.748-1.048 2.748-1.048.545 1.405.202 2.444.1 2.7.64.718 1.028 1.63 1.028 2.747 0 3.933-2.338 4.799-4.566 5.053.36.32.679.949.679 1.914 0 1.381-.013 2.496-.013 2.835 0 .277.18.596.688.495A10.03 10.03 0 0 0 22 12.253C22 6.589 17.523 2 12 2Z"
                  />
                </svg>
              </a>
              <a aria-label="Twitter" className="hover:text-white" href="#">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.543 7.104c.014.2.014.402.014.605 0 6.163-4.693 13.27-13.27 13.27-2.636 0-5.087-.77-7.15-2.1.366.043.718.058 1.1.058a9.39 9.39 0 0 0 5.824-2.007 4.693 4.693 0 0 1-4.379-3.252c.29.043.58.072.884.072.423 0 .846-.057 1.24-.162A4.686 4.686 0 0 1 2.9 8.47v-.058c.66.366 1.424.588 2.235.616A4.685 4.685 0 0 1 3.2 5.29c0-.87.232-1.679.64-2.378a13.32 13.32 0 0 0 9.66 4.9 5.285 5.285 0 0 1-.116-1.072 4.684 4.684 0 0 1 8.102-3.2 9.325 9.325 0 0 0 2.972-1.132 4.703 4.703 0 0 1-2.058 2.583 9.365 9.365 0 0 0 2.694-.73 10.068 10.068 0 0 1-2.549 2.643Z" />
                </svg>
              </a>
              <a aria-label="Butterfly" className="hover:text-white" href="#">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 13c-1.657 0-3-1.343-3-3V4c0-.552.448-1 1-1s1 .448 1 1v3h2V4a1 1 0 1 1 2 0v6c0 1.657-1.343 3-3 3Zm7.5-4.5c-2 0-4 1-4 3s2 4 4 4 2-1.5 2-3.5-1-3.5-2-3.5ZM4.5 8.5c-1 0-2 1.5-2 3.5S3 15.5 4.5 15.5s4-2 4-4-2-3-4-3Z" />
                </svg>
              </a>
              <a aria-label="Lock" className="hover:text-white" href="#">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1Zm2 0h8V8a4 4 0 1 0-8 0v2Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right: Automated Grading System visual */}
          <div className="relative hidden lg:block">
            <AGSVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
