"use client";

import { useMemo, useState } from "react";

const features = [
  [
    "01",
    "Smart Study Plan",
    "Turn your exam date and subjects into a clear daily plan.",
  ],
  [
    "02",
    "Quick Revision",
    "Keep important topics and last-minute revision in one place.",
  ],
  [
    "03",
    "Progress Tracking",
    "See what is done, what is next, and where you need more time.",
  ],
];

export default function Home() {
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState("");
  const [plan, setPlan] = useState<string[]>([]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");

  const subjectList = useMemo(
    () =>
      subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [subjects]
  );

  function createPlan() {
    if (!examDate || subjectList.length === 0) return;

    const today = new Date();
    const exam = new Date(examDate);

    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);

    const diffTime = exam.getTime() - today.getTime();

    const daysLeft = Math.max(
      1,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    );

    const newPlan = subjectList.map((subject, i) => {
      const day = (i % daysLeft) + 1;
      return `Day ${day}: Study ${subject}`;
    });

    setPlan(newPlan);
  }

  function askAI() {
    if (!aiQuestion.trim()) return;

    setAiAnswer(
      `Demo AI response: Great question! Start by breaking "${aiQuestion}" into smaller topics, learn the concept, and then practice questions. Real AI will be connected in the next step.`
    );
  }

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <div className="text-xl font-black tracking-tight">
            Study<span className="text-violet-400">One</span>
          </div>

          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Learn • Plan • Achieve
          </div>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          <a
            href="#"
            className="text-sm font-semibold text-white/80 hover:text-white"
          >
            Home
          </a>

          <a
            href="#planner"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            Planner
          </a>

          <a
            href="#features"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            Features
          </a>

          <a
            href="#ai"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            AI Assistant
          </a>

          <a
            href="#progress"
            className="text-sm font-semibold text-white/60 hover:text-white"
          >
            Progress
          </a>
        </div>

        <a
          href="#planner"
          className="rounded-full bg-violet-500 px-5 py-2 text-sm font-bold transition hover:bg-violet-400"
        >
          Try planner →
        </a>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

        <p className="mb-5 text-sm font-bold uppercase tracking-[0.25em] text-violet-300">
          Study smarter
        </p>

        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
          One place to plan your{" "}
          <span className="text-violet-400">study.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/60">
          StudyOne helps students turn a deadline into a simple plan they can
          actually follow.
        </p>

        <a
          href="#planner"
          className="mt-9 inline-flex rounded-2xl bg-violet-500 px-7 py-4 font-bold shadow-2xl shadow-violet-500/20 transition hover:bg-violet-400"
        >
          Build my plan →
        </a>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3"
      >
        {features.map(([n, title, desc]) => (
          <div
            key={n}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-7"
          >
            <div className="mb-10 text-sm font-bold text-violet-300">
              {n}
            </div>

            <h2 className="text-2xl font-bold">{title}</h2>

            <p className="mt-3 leading-7 text-white/55">{desc}</p>
          </div>
        ))}
      </section>

      {/* Planner */}
      <section id="planner" className="mx-auto max-w-3xl px-6 pb-28">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl md:p-10">
          <p className="text-sm font-bold text-violet-300">
            SMART PLANNER
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Create your first plan
          </h2>

          <p className="mt-2 text-white/50">
            Enter your exam date and subjects to generate your study plan.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-semibold text-white/70">
              Exam date

              <input
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                type="date"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-400"
              />
            </label>

            <label className="block text-sm font-semibold text-white/70">
              Subjects

              <input
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="Maths, Science, English"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-400"
              />
            </label>
          </div>

          <button
            onClick={createPlan}
            className="mt-6 w-full rounded-xl bg-white px-5 py-3.5 font-bold text-black hover:bg-white/90"
          >
            Generate plan
          </button>

          {plan.length > 0 && (
            <div className="mt-7 space-y-2">
              {plan.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white/80"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI Assistant */}
      <section id="ai" className="mx-auto max-w-3xl px-6 pb-28">
        <div className="rounded-[2rem] border border-violet-400/20 bg-violet-500/[0.06] p-7 shadow-2xl md:p-10">
          <p className="text-sm font-bold text-violet-300">
            STUDYONE AI
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Ask your study assistant
          </h2>

          <p className="mt-3 text-white/60">
            Ask anything about your studies and get instant help.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <input
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  askAI();
                }
              }}
              placeholder="Ask StudyOne AI..."
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-400"
            />

            <button
              onClick={askAI}
              className="rounded-xl bg-violet-500 px-6 py-3 font-bold hover:bg-violet-400"
            >
              Ask
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-white/60">
            {aiAnswer ||
              "👋 Hi! I'm StudyOne AI. Ask me something about your studies."}
          </div>
        </div>
      </section>

      {/* Progress */}
      <section id="progress" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center">
          <p className="text-sm font-bold text-violet-300">
            PROGRESS
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Your progress, coming next
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-white/50">
            Track completed subjects, study sessions, and your preparation
            progress here.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-white/40">
        © {new Date().getFullYear()} StudyOne.shop
      </footer>
    </main>
  );
}