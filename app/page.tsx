"use client";

import { useMemo, useState } from "react";

const features = [
  ["01", "Smart Study Plan", "Turn your exam date and subjects into a clear daily plan."],
  ["02", "Quick Revision", "Keep important topics and last-minute revision in one place."],
  ["03", "Progress Tracking", "See what is done, what is next, and where you need more time."],
];

export default function Home() {
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState("");
  const [plan, setPlan] = useState<string[]>([]);

  const subjectList = useMemo(() => subjects.split(",").map(s => s.trim()).filter(Boolean), [subjects]);

  function createPlan() {
    if (!examDate || subjectList.length === 0) return;
    setPlan(subjectList.map((s, i) => `Day ${i + 1}: ${s}`));
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-black tracking-tight">Study<span className="text-violet-400">One</span></div>
        <a href="#planner" className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold hover:bg-white/5">Try planner</a>
      </nav>

      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.25em] text-violet-300">Study smarter</p>
        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
          One place to plan your <span className="text-violet-400">study.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/60">
          StudyOne helps students turn a deadline into a simple plan they can actually follow.
        </p>
        <a href="#planner" className="mt-9 inline-flex rounded-2xl bg-violet-500 px-7 py-4 font-bold shadow-2xl shadow-violet-500/20 transition hover:bg-violet-400">Build my plan →</a>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {features.map(([n, title, desc]) => (
          <div key={n} className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
            <div className="mb-10 text-sm font-bold text-violet-300">{n}</div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-3 leading-7 text-white/55">{desc}</p>
          </div>
        ))}
      </section>

      <section id="planner" className="mx-auto max-w-3xl px-6 pb-28">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl md:p-10">
          <p className="text-sm font-bold text-violet-300">MVP PLANNER</p>
          <h2 className="mt-2 text-3xl font-black">Create your first plan</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-semibold text-white/70">
              Exam date
              <input value={examDate} onChange={e => setExamDate(e.target.value)} type="date" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-400" />
            </label>
            <label className="block text-sm font-semibold text-white/70">
              Subjects
              <input value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="Maths, Science, English" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-400" />
            </label>
          </div>
          <button onClick={createPlan} className="mt-6 w-full rounded-xl bg-white px-5 py-3.5 font-bold text-black hover:bg-white/90">Generate plan</button>
          {plan.length > 0 && (
            <div className="mt-7 space-y-2">
              {plan.map(item => <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white/80">{item}</div>)}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-white/40">© {new Date().getFullYear()} StudyOne.shop</footer>
    </main>
  );
}
