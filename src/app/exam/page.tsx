"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/auth-context";
import { supabase , Question } from "../lib/supabase/client";
import { clear } from "console";

type QuestionStatus = "answered" | "notAnswered" | "notVisited" | "marked" | "markedAndAnswered";

const STATUS_STYLES: Record<QuestionStatus, string> = {
  answered: "border-emerald-300 bg-emerald-100 text-emerald-700",
  notAnswered: "border-rose-300 bg-rose-100 text-rose-700",
  notVisited: "border-slate-200 bg-white text-slate-400",
  marked: "border-purple-300 bg-purple-100 text-purple-600",
  markedAndAnswered: "border-blue-400 bg-blue-100 text-blue-700",
};

const LEGEND: Array<{ status: QuestionStatus; label: string; dotClass: string }> = [
  { status: "answered", label: "Answered", dotClass: "bg-emerald-500" },
  { status: "notAnswered", label: "Not Answered", dotClass: "bg-rose-500" },
  { status: "notVisited", label: "Not Visited", dotClass: "bg-slate-400" },
  { status: "marked", label: "Marked for Review", dotClass: "bg-purple-500" },
  { status: "markedAndAnswered", label: "Answered & Marked", dotClass: "bg-blue-500" },
];

const EXAM_DURATION_SECONDS = 60 * 60;

export default function ExamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({ 0: "" });
  const [statuses, setStatuses] = useState<QuestionStatus[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS - 50);

  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [scoreReceived, setScoreReceived] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (user.role === "admin") {
      router.replace("/dashboard");
    }
    // if (user.role === "user") {
    //   router.replace("/");
    // }
  }, [loading, user, router]);

  // fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setQuestionsLoading(true);
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .order('id', { ascending: true })
          .limit(30);
        
        if (error) throw error;
        
        setQuestions(data || []);
        const questionCount = data?.length || 0;
        setStatuses(Array(questionCount).fill("notVisited").map((_, idx) => 
          idx === 0 ? "notAnswered" : "notVisited"
        ));
        setResponses({ 0: "" });
      } catch (err) {
        setQuestionsError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setQuestionsLoading(false);
      }
    }
      if (user && user.role !== "admin") {
        fetchQuestions();
      }
    }, [user]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const question = useMemo(() => questions[activeIndex], [questions, activeIndex]);
  const answer = responses[activeIndex] ?? "";
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const totalQuestions = questions.length;

  const attemptedCount = statuses.filter((s) => s === "answered" || s === "markedAndAnswered").length;
  const markedCount = statuses.filter((s) => s === "marked" || s === "markedAndAnswered").length;

  if (questionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="text-slate-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  function computeStatus(index: number, currentStatus: QuestionStatus, value: string) {
    const hasResponse = value.trim().length > 0;
    if (currentStatus === "marked" || currentStatus === "markedAndAnswered") {
      return hasResponse ? "markedAndAnswered" : "marked";
    }
    return hasResponse ? "answered" : "notAnswered";
  }

  function ensureVisited(index: number, currentStatus: QuestionStatus) {
    return currentStatus === "notVisited" ? "notAnswered" : currentStatus;
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setResponses((prev) => ({ ...prev, [activeIndex]: value }));
    setStatuses((prev) =>
      prev.map((status, idx) => (idx === activeIndex ? computeStatus(idx, status, value) : status))
    );
  }

  function moveToQuestion(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= totalQuestions) return;
    setStatuses((prev) =>
      prev.map((status, idx) => {
        if (idx === nextIndex) {
          return ensureVisited(idx, status);
        }
        return status;
      })
    );
    setResponses((prev) => ({ ...prev, [nextIndex]: prev[nextIndex] ?? "" }));
    setActiveIndex(nextIndex);
  }

  function goPrev() {
    if (activeIndex > 0) {
      moveToQuestion(activeIndex - 1);
    }
  }

  function goNext() {
    if (activeIndex < totalQuestions - 1) {
      moveToQuestion(activeIndex + 1);
    }
  }

  function markForReview() {
    setStatuses((prev) =>
      prev.map((status, idx) => {
        if (idx === activeIndex) {
          const hasResponse = (responses[idx] ?? "").trim().length > 0;
          return hasResponse ? "markedAndAnswered" : "marked";
        }
        return status;
      })
    );
    goNext();
  }

  function clearResponse() {
    setResponses((prev) => ({ ...prev, [activeIndex]: "" }));
    setStatuses((prev) =>
      prev.map((status, idx) => (idx === activeIndex ? "notAnswered" : status))
    );
  }

  function saveAndNext() {
    setSaved(true);
    setStatuses((prev) =>
      prev.map((status, idx) => {
        if (idx === activeIndex) {
          return (responses[idx] ?? "").trim().length > 0 ? "answered" : "notAnswered";
        }
        return status;
      })
    );
    goNext();
  }

// submit function
  async function submitPaper() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const essays = questions.map((_, idx) => responses[idx] || "");

      if (essays.every((e)=> e.trim()==="")){
        setSubmissionError("Cannot submit empty answers");
        setIsSubmitting(false);
        return;
      }
      
      // Submit to API, route exam
      const response = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "submit-essays",
          essays,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }
      
      setStatuses((prev) =>
        prev.map((status) => (status === "notVisited" ? "notAnswered" : status))
      );
      
      // debug score
      console.log('Scores received:', data);
      setScoreReceived(true);

      // arahkan ke page lain (to do)
      const normalizedStatuses = statuses.map((status, idx) => {
        const visitedStatus = ensureVisited(idx, status);
        return computeStatus(idx, visitedStatus, responses[idx] ?? "");
      });
  
      const totalCount = questions.length;
      const answeredCount = normalizedStatuses.filter(
        (status) => status === "answered" || status === "markedAndAnswered"
      ).length;
      const markedTotal = normalizedStatuses.filter(
        (status) => status === "marked" || status === "markedAndAnswered"
      ).length;
      const skippedCount = Math.max(0, totalCount - answeredCount);
      const timeTakenSeconds = Math.max(0, EXAM_DURATION_SECONDS - secondsLeft);

      const maxScore = totalCount * 10;
      const score = answeredCount * 10;
      
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
      //
      const taskAchievement = data.task_achievement_average;
      const coherenceAndCohesion = data.coherence_and_cohesion_average;
      const lexicalResource = data.lexical_resource_average;
      const grammaticalRange = data.grammatical_range_average;
      const overallBand = 
        (taskAchievement + coherenceAndCohesion + lexicalResource + grammaticalRange) / 4
      ;
  
      setStatuses(normalizedStatuses);
  
      const params = new URLSearchParams({
        total: String(totalCount),
        attempted: String(answeredCount),
        marked: String(markedTotal),
        skipped: String(skippedCount),
        score: String(score),
        maxScore: String(maxScore),
        timeTaken: String(timeTakenSeconds),
        duration: String(EXAM_DURATION_SECONDS),
        percentage: String(Math.round(percentage)),
        ta: String(taskAchievement),
        cc: String(coherenceAndCohesion),
        lr: String(lexicalResource),
        gr: String(grammaticalRange),
        band: String(overallBand),
      });
  
      router.push(`/exam/score?${params.toString()}`);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <section className="relative min-h-screen bg-slate-100 px-4 pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-[0_32px_80px_rgba(15,23,42,0.16)]">
          <header className="flex flex-wrap items-center justify-between gap-4 bg-[#0b1f3a] px-6 py-4 text-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <span className="rounded-md bg-white px-3 py-1 text-[#0b1f3a]">I-Gras</span>
                <span className="opacity-60">|</span>
                <Link href="/" className="text-white transition hover:text-sky-200">Beranda</Link>
              </div>
              <div className="hidden sm:block text-xs text-sky-100">
                <div className="font-semibold">{user?.name ?? "Peserta"}</div>
                <div>Long Answer Type Question</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 text-sky-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 4a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm0 5a5 5 0 0 0-5 5h2a3 3 0 0 1 6 0h2a5 5 0 0 0-5-5Z"/></svg>
                <span>Autosaved just now</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[11px] uppercase tracking-widest text-sky-200">Test Time</div>
                <span className="rounded-md bg-white/15 px-3 py-1 text-sm font-semibold">{formatTime(secondsLeft)}</span>
              </div>
              <div className="hidden md:flex flex-col text-[11px] text-sky-100">
                <div>ID: IG-{user?.email?.split("@")[0] ?? "0001"}</div>
                <div>Attempted {attemptedCount}/{totalQuestions}</div>
              </div>
              {/* finish test */}
              <button 
                onClick={submitPaper} 
                disabled={isSubmitting}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400 disabled:opacity-50"
                >
                {isSubmitting ? "Submitting..." : "Finish Test"}
              </button>
            </div>
          </header>

          <div className="grid md:grid-cols-[1.05fr_1.35fr]">
            <main className="space-y-5 border-b border-slate-200 bg-[#f7f9fc] px-6 py-6 md:border-b-0 md:border-r">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                  {/* <span>{question.section}</span> */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Attempted {attemptedCount}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>Marked {markedCount}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>Total {totalQuestions}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-700">
                    <span className="rounded-md bg-blue-100 px-2 py-1 text-blue-600 uppercase">Question {activeIndex + 1}</span>
                  </div>
                  <span>Marks 0.1 | Negative 0.33</span>
                </div>

              <div className="mt-3 text-sm text-slate-600">
                <div className="rounded-md border border-transparent p-0 text-slate-700 whitespace-pre-line">
                  {question.prompt}
                </div>
              </div>
            </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Instructions</h3>
                <ul className="list-disc space-y-2 pl-4">
                  <li>Pastikan jawaban minimal 100 kata agar sistem menilai secara optimal.</li>
                  <li>Gunakan tombol Save & Next sebelum berpindah ke soal berikutnya.</li>
                  <li>Tandai soal dengan Mark for Review & Next untuk ditinjau ulang nanti.</li>
                </ul>
              </div>
            </main>

            <aside className="space-y-5 bg-white px-6 py-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Enter your Response</h3>
                  </div>
                  <button onClick={clearResponse} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-300">
                    Clear Response
                  </button>
                </div>

                <textarea
                  value={answer}
                  onChange={handleChange}
                  placeholder="Tulis jawabanmu di sini..."
                  className="mt-3 w-full min-h-[220px] resize-vertical rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{wordCount} words</span>
                  <span>Auto-saved</span>
                </div>
              </div>

              {saved && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
                  Jawaban tersimpan. Anda dapat meninjau ulang sebelum waktu berakhir.
                </div>
              )}

              {isSubmitting && !scoreReceived && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
                  Semua jawaban telah tersimpan. Hasil akan keluar sesaat lagi
                </div>
              )}

              {submissionError && (
                <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
                  Error: {submissionError}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={goPrev}
                    disabled={activeIndex === 0}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <button
                    onClick={saveAndNext}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                  >
                    Save & Next
                  </button>
                  <button
                    onClick={markForReview}
                    className="rounded-lg border border-purple-300 bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-200"
                  >
                    Mark for Review & Next
                  </button>

                  <button
                    onClick={submitPaper}
                    disabled={isSubmitting}
                    className="rounded-lg border border-emerald-400 bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Paper"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Question Navigator</h4>
                  <span className="text-xs text-slate-500">Total {totalQuestions}</span>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2 text-xs font-semibold">
                {questions.map((_, idx) => {
                  const status = statuses[idx];
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => moveToQuestion(idx)}
                      className={`h-10 w-10 rounded-full border transition ${STATUS_STYLES[status]} ${isActive ? "ring-2 ring-offset-2 ring-blue-400" : ""}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  {LEGEND.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${item.dotClass}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}




