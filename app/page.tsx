"use client";

import { useEffect, useMemo, useState } from "react";

type Section =
  | "home"
  | "planner"
  | "quiz"
  | "pdf"
  | "revision"
  | "exam"
  | "progress"
  | "mistakes"
  | "fun"
  | "settings";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type Mistake = {
  id: string;
  question: string;
  subject: string;
  chapter: string;
  yourAnswer: string;
  correctAnswer: string;
  explanation: string;
  date: string;
};

type QuizHistory = {
  id: string;
  subject: string;
  chapter: string;
  score: number;
  total: number;
  accuracy: number;
  type: "AI Quiz" | "Mistake Practice";
  date: string;
  completedAt?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const thoughtMessages = [
  "One chapter at a time. That's enough.",
  "Don't wait for motivation. Start with one question.",
  "Today's effort becomes tomorrow's confidence.",
  "You don't need a perfect study session. You need a real one.",
  "Progress doesn't have to be loud to be real.",
  "Keep going. Your future self will thank you.",
];

const navGroups = [
  {
    title: "STUDY",
    items: [
      { id: "home", label: "Home", icon: "⌂" },
      { id: "planner", label: "Study Planner", icon: "▣" },
      { id: "quiz", label: "AI Quiz", icon: "✦" },
      { id: "pdf", label: "PDF Notes", icon: "▤" },
      { id: "revision", label: "Quick Revision", icon: "↻" },
      { id: "exam", label: "Exam Mode", icon: "◎" },
    ],
  },
  {
    title: "YOUR PROGRESS",
    items: [
      { id: "progress", label: "Progress", icon: "◒" },
      { id: "mistakes", label: "Mistakes", icon: "×" },
    ],
  },
  {
    title: "MORE",
    items: [
      { id: "fun", label: "Fun Zone", icon: "♟" },
      { id: "settings", label: "Settings", icon: "⚙" },
    ],
  },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---------------- HOME AI ---------------- */

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  /* ---------------- PLANNER ---------------- */

  const [className, setClassName] = useState("Class 10");
  const [board, setBoard] = useState("MP Board");
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState("");
  const [studyTime, setStudyTime] = useState("2 hours");
  const [plan, setPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);

  /* ---------------- PDF ---------------- */

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPrompt, setPdfPrompt] = useState(
    "Create simple exam-focused notes from this PDF."
  );
  const [pdfNotes, setPdfNotes] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  /* ---------------- QUIZ ---------------- */

  const [quizSubject, setQuizSubject] = useState("");
  const [quizChapter, setQuizChapter] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizType, setQuizType] = useState<
    "AI Quiz" | "Mistake Practice"
  >("AI Quiz");

  /* ---------------- MISTAKES ---------------- */

  const [mistakes, setMistakes] = useState<Mistake[]>([]);

  /* ---------------- PROGRESS ---------------- */

  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);

  /* ---------------- FOCUS TIMER ---------------- */

  const [studySeconds, setStudySeconds] = useState(0);
  const STUDY_GOAL = 30 * 60;

  const studyUnlocked = studySeconds >= STUDY_GOAL;

  /* ---------------- FUN GAMES ---------------- */

  const [reactionStarted, setReactionStarted] = useState(false);
  const [reactionReady, setReactionReady] = useState(false);
  const [reactionStartTime, setReactionStartTime] = useState(0);
  const [reactionResult, setReactionResult] = useState<number | null>(null);

  const [memoryCards, setMemoryCards] = useState<
    { id: number; value: string; matched: boolean; flipped: boolean }[]
  >([]);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);

  const [numberTarget, setNumberTarget] = useState<number | null>(null);
  const [numberInput, setNumberInput] = useState("");
  const [numberMessage, setNumberMessage] = useState("");

  /* ---------------- THOUGHT ---------------- */

  const [thoughtIndex, setThoughtIndex] = useState(0);

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    try {
      const savedMistakes = localStorage.getItem("studyone_mistakes");
      const savedHistory = localStorage.getItem("studyone_quiz_history");
      const savedStudySeconds = localStorage.getItem(
        "studyone_study_seconds"
      );
      const savedChat = localStorage.getItem("studyone_chat");

      if (savedMistakes) {
        setMistakes(JSON.parse(savedMistakes));
      }

      if (savedHistory) {
        setQuizHistory(JSON.parse(savedHistory));
      }

      if (savedStudySeconds) {
        setStudySeconds(Number(savedStudySeconds));
      }

      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      }
    } catch (error) {
      console.error("StudyOne localStorage error:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "studyone_mistakes",
      JSON.stringify(mistakes)
    );
  }, [mistakes]);

  useEffect(() => {
    localStorage.setItem(
      "studyone_quiz_history",
      JSON.stringify(quizHistory)
    );
  }, [quizHistory]);

  useEffect(() => {
    localStorage.setItem(
      "studyone_study_seconds",
      String(studySeconds)
    );
  }, [studySeconds]);

  useEffect(() => {
    localStorage.setItem(
      "studyone_chat",
      JSON.stringify(chatMessages)
    );
  }, [chatMessages]);

  /* ---------------- STUDY TIMER ---------------- */

  useEffect(() => {
    if (studyUnlocked) return;

    const timer = setInterval(() => {
      setStudySeconds((previous) => {
        if (previous >= STUDY_GOAL) {
          return STUDY_GOAL;
        }

        return previous + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [studyUnlocked]);

  /* ---------------- THOUGHT ROTATION ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setThoughtIndex((previous) => {
        return (previous + 1) % thoughtMessages.length;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- HELPERS ---------------- */

  function navigate(section: Section) {
    setActiveSection(section);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  }

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }

  /* ---------------- HOME AI ---------------- */

  async function sendChatMessage(customPrompt?: string) {
    const prompt = (customPrompt ?? chatInput).trim();

    if (!prompt || chatLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: prompt,
    };

    setChatMessages((previous) => [...previous, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `
You are StudyOne AI.

Student:
Class: ${className}
Board: ${board}

Help the student with studying.

Give simple, clear, practical answers.
Use headings and bullet points when useful.
Do not invent syllabus information.
If the student asks for a study plan, make it realistic.
If they ask to explain something, teach it step by step.

Student's question:
${prompt}
          `.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI request failed.");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.answer,
      };

      setChatMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(error);

      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I couldn't connect to the AI right now. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleChatKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage();
    }
  }

  /* ---------------- PLANNER ---------------- */

  async function createPlan() {
    if (!subjects.trim()) {
      alert("Please enter your subjects.");
      return;
    }

    setPlanLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `
Create a realistic exam study plan.

Class: ${className}
Board: ${board}
Exam date: ${examDate || "Not provided"}
Subjects: ${subjects}
Available study time per day: ${studyTime}

Rules:
- Include all provided subjects.
- Keep the plan realistic.
- Prioritize difficult subjects.
- Include revision and practice.
- Do not invent specific syllabus topics.
- Use clear day-by-day sections.
- Keep it easy for a student to follow.
          `.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Planner failed.");
      }

      setPlan(data.answer);
    } catch (error) {
      console.error(error);
      setPlan("Sorry, I couldn't create the plan. Please try again.");
    } finally {
      setPlanLoading(false);
    }
  }

  /* ---------------- PDF NOTES ---------------- */

  async function generatePdfNotes() {
    if (!pdfFile) {
      alert("Please select a PDF first.");
      return;
    }

    setPdfLoading(true);
    setPdfNotes("");

    try {
      const formData = new FormData();

      formData.append("file", pdfFile);
      formData.append("prompt", pdfPrompt);

      const response = await fetch("/api/ai", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "PDF processing failed.");
      }

      setPdfNotes(data.answer);
    } catch (error) {
      console.error(error);
      setPdfNotes(
        error instanceof Error
          ? error.message
          : "Couldn't process this PDF."
      );
    } finally {
      setPdfLoading(false);
    }
  }

  /* ---------------- QUIZ ---------------- */

  async function startQuiz(
    practiceMistakes = false
  ) {
    if (!quizSubject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    setQuizLoading(true);
    setQuizFinished(false);
    setQuizStarted(false);
    setQuizQuestions([]);
    setQuizIndex(0);
    setSelectedAnswer("");
    setShowExplanation(false);
    setQuizScore(0);

    setQuizType(
      practiceMistakes ? "Mistake Practice" : "AI Quiz"
    );

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "quiz",
          className,
          board,
          subject: quizSubject,
          chapter: quizChapter,
          practiceMistakes,
          mistakes: practiceMistakes
            ? mistakes.slice(-10)
            : [],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Quiz generation failed.");
      }

      setQuizQuestions(data.questions);
      setQuizStarted(true);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Couldn't generate the quiz."
      );
    } finally {
      setQuizLoading(false);
    }
  }

  function chooseAnswer(answer: string) {
    if (selectedAnswer || showExplanation) return;

    const currentQuestion = quizQuestions[quizIndex];

    if (!currentQuestion) return;

    setSelectedAnswer(answer);
    setShowExplanation(true);

    if (answer === currentQuestion.answer) {
      setQuizScore((previous) => previous + 1);
    }
  }

  function finishQuiz(finalScore: number) {
    if (quizQuestions.length === 0) return;

    const total = quizQuestions.length;
    const accuracy = Math.round((finalScore / total) * 100);

    const historyItem: QuizHistory = {
      id: `${Date.now()}-${Math.random()}`,
      subject: quizSubject,
      chapter: quizChapter || "General",
      score: finalScore,
      total,
      accuracy,
      type: quizType,
      date: new Date().toLocaleDateString("en-IN"),
      completedAt: new Date().toISOString(),
    };

    setQuizHistory((previous) => [
      historyItem,
      ...previous,
    ]);

    setQuizFinished(true);
  }

  function nextQuestion() {
    const currentQuestion = quizQuestions[quizIndex];

    if (!currentQuestion) return;

    if (
      selectedAnswer &&
      selectedAnswer !== currentQuestion.answer
    ) {
      const alreadySaved = mistakes.some(
        (mistake) =>
          mistake.question === currentQuestion.question &&
          mistake.subject === quizSubject
      );

      if (!alreadySaved) {
        const newMistake: Mistake = {
          id: `${Date.now()}-${Math.random()}`,
          question: currentQuestion.question,
          subject: quizSubject,
          chapter: quizChapter || "General",
          yourAnswer: selectedAnswer,
          correctAnswer: currentQuestion.answer,
          explanation: currentQuestion.explanation,
          date: new Date().toISOString(),
        };

        setMistakes((previous) => [
          newMistake,
          ...previous,
        ]);
      }
    }

    if (quizIndex >= quizQuestions.length - 1) {
      const finalScore =
        quizScore +
        (selectedAnswer === currentQuestion.answer ? 1 : 0);

      finishQuiz(finalScore);
      return;
    }

    setQuizIndex((previous) => previous + 1);
    setSelectedAnswer("");
    setShowExplanation(false);
  }

  function resetQuiz() {
    setQuizStarted(false);
    setQuizFinished(false);
    setQuizQuestions([]);
    setQuizIndex(0);
    setSelectedAnswer("");
    setShowExplanation(false);
    setQuizScore(0);
  }

  /* ---------------- MISTAKES ---------------- */

  function clearMistakes() {
    if (mistakes.length === 0) return;

    const confirmed = window.confirm(
      "Clear all saved mistakes?"
    );

    if (confirmed) {
      setMistakes([]);
    }
  }

  function practiceMistakes() {
    if (mistakes.length === 0) {
      alert("You don't have any saved mistakes yet.");
      return;
    }

    navigate("quiz");
    setQuizSubject(mistakes[0]?.subject || "");
    setQuizChapter("");
  }

  /* ---------------- PROGRESS ---------------- */

  const progress = useMemo(() => {
    const totalQuizzes = quizHistory.length;

    const totalQuestions = quizHistory.reduce(
      (sum, quiz) => sum + quiz.total,
      0
    );

    const totalCorrect = quizHistory.reduce(
      (sum, quiz) => sum + quiz.score,
      0
    );

    const totalMistakes = Math.max(
      0,
      totalQuestions - totalCorrect
    );

    const averageAccuracy =
      totalQuizzes > 0
        ? Math.round(
            quizHistory.reduce(
              (sum, quiz) => sum + quiz.accuracy,
              0
            ) / totalQuizzes
          )
        : 0;

    const latestAccuracy =
      quizHistory.length > 0
        ? quizHistory[0].accuracy
        : 0;

    const previousAccuracy =
      quizHistory.length > 1
        ? quizHistory[1].accuracy
        : null;

    const improvement =
      previousAccuracy === null
        ? null
        : latestAccuracy - previousAccuracy;

    const subjectMap: Record<
      string,
      { correct: number; total: number }
    > = {};

    quizHistory.forEach((quiz) => {
      if (!subjectMap[quiz.subject]) {
        subjectMap[quiz.subject] = {
          correct: 0,
          total: 0,
        };
      }

      subjectMap[quiz.subject].correct += quiz.score;
      subjectMap[quiz.subject].total += quiz.total;
    });

    const subjectPerformance = Object.entries(subjectMap)
      .map(([subject, data]) => ({
        subject,
        accuracy:
          data.total > 0
            ? Math.round((data.correct / data.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const strongestSubject =
      subjectPerformance.length > 0
        ? subjectPerformance[0]
        : null;

    const weakestSubject =
      subjectPerformance.length > 0
        ? subjectPerformance[subjectPerformance.length - 1]
        : null;

    return {
      totalQuizzes,
      totalQuestions,
      totalCorrect,
      totalMistakes,
      averageAccuracy,
      latestAccuracy,
      improvement,
      subjectPerformance,
      strongestSubject,
      weakestSubject,
    };
  }, [quizHistory]);

  /* ---------------- STREAK ---------------- */

  const streak = useMemo(() => {
    const daySet = new Set<string>();

    quizHistory.forEach((quiz) => {
      if (!quiz.completedAt) return;

      const date = new Date(quiz.completedAt);

      if (Number.isNaN(date.getTime())) return;

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      daySet.add(key);
    });

    const days = Array.from(daySet).sort();

    let best = 0;
    let current = 0;

    for (let i = 0; i < days.length; i++) {
      if (i === 0) {
        current = 1;
      } else {
        const previous = new Date(`${days[i - 1]}T00:00:00`);
        const currentDate = new Date(`${days[i]}T00:00:00`);

        const difference =
          (currentDate.getTime() - previous.getTime()) /
          (1000 * 60 * 60 * 24);

        if (difference === 1) {
          current += 1;
        } else {
          current = 1;
        }
      }

      best = Math.max(best, current);
    }

    const today = new Date();

    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayKey = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, "0"),
      String(yesterday.getDate()).padStart(2, "0"),
    ].join("-");

    let currentStreak = 0;

    if (daySet.has(todayKey)) {
      currentStreak = 1;

      let cursor = new Date(today);

      while (true) {
        cursor.setDate(cursor.getDate() - 1);

        const key = [
          cursor.getFullYear(),
          String(cursor.getMonth() + 1).padStart(2, "0"),
          String(cursor.getDate()).padStart(2, "0"),
        ].join("-");

        if (!daySet.has(key)) break;

        currentStreak += 1;
      }
    } else if (daySet.has(yesterdayKey)) {
      currentStreak = 1;

      let cursor = new Date(yesterday);

      while (true) {
        cursor.setDate(cursor.getDate() - 1);

        const key = [
          cursor.getFullYear(),
          String(cursor.getMonth() + 1).padStart(2, "0"),
          String(cursor.getDate()).padStart(2, "0"),
        ].join("-");

        if (!daySet.has(key)) break;

        currentStreak += 1;
      }
    }

    return {
      current: currentStreak,
      best,
    };
  }, [quizHistory]);

  function clearProgress() {
    const confirmed = window.confirm(
      "Reset all quiz progress and history?"
    );

    if (!confirmed) return;

    setQuizHistory([]);
    localStorage.removeItem("studyone_quiz_history");
  }

  /* ---------------- FUN ZONE ---------------- */

  function startReactionGame() {
    if (!studyUnlocked) return;

    setReactionStarted(true);
    setReactionReady(false);
    setReactionResult(null);

    const delay = 1500 + Math.random() * 3500;

    setTimeout(() => {
      setReactionReady(true);
      setReactionStartTime(Date.now());
    }, delay);
  }

  function clickReaction() {
    if (!reactionStarted) return;

    if (!reactionReady) {
      setReactionStarted(false);
      setReactionResult(-1);
      return;
    }

    const result = Date.now() - reactionStartTime;

    setReactionResult(result);
    setReactionStarted(false);
    setReactionReady(false);
  }

  function createMemoryGame() {
    const values = ["A", "B", "C", "D", "E", "F"];

    const shuffled = [
      ...values,
      ...values,
    ].sort(() => Math.random() - 0.5);

    setMemoryCards(
      shuffled.map((value, index) => ({
        id: index,
        value,
        matched: false,
        flipped: false,
      }))
    );

    setMemoryFlipped([]);
    setMemoryMoves(0);
  }

  useEffect(() => {
    if (memoryFlipped.length !== 2) return;

    const [firstId, secondId] = memoryFlipped;

    const first = memoryCards.find(
      (card) => card.id === firstId
    );
    const second = memoryCards.find(
      (card) => card.id === secondId
    );

    if (!first || !second) return;

    setMemoryMoves((previous) => previous + 1);

    if (first.value === second.value) {
      setTimeout(() => {
        setMemoryCards((previous) =>
          previous.map((card) =>
            card.id === firstId || card.id === secondId
              ? { ...card, matched: true }
              : card
          )
        );

        setMemoryFlipped([]);
      }, 350);
    } else {
      setTimeout(() => {
        setMemoryCards((previous) =>
          previous.map((card) =>
            card.id === firstId || card.id === secondId
              ? { ...card, flipped: false }
              : card
          )
        );

        setMemoryFlipped([]);
      }, 700);
    }
  }, [memoryFlipped, memoryCards]);

  function flipMemoryCard(id: number) {
    if (memoryFlipped.length >= 2) return;

    const card = memoryCards.find(
      (item) => item.id === id
    );

    if (!card || card.flipped || card.matched) return;

    setMemoryCards((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, flipped: true }
          : item
      )
    );

    setMemoryFlipped((previous) => [...previous, id]);
  }

  function startNumberGame() {
    const target = Math.floor(Math.random() * 100) + 1;

    setNumberTarget(target);
    setNumberInput("");
    setNumberMessage("Guess a number from 1 to 100.");
  }

  function checkNumberGuess() {
    if (numberTarget === null) return;

    const guess = Number(numberInput);

    if (!guess) return;

    if (guess === numberTarget) {
      setNumberMessage("🎉 Correct! New number unlocked.");
      setNumberTarget(
        Math.floor(Math.random() * 100) + 1
      );
      setNumberInput("");
      return;
    }

    if (guess < numberTarget) {
      setNumberMessage("⬆️ Go higher!");
    } else {
      setNumberMessage("⬇️ Go lower!");
    }
  }

  /* ---------------- UI ---------------- */

  function renderSidebar() {
    return (
      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <div className="brand-name">StudyOne</div>
            <div className="brand-subtitle">
              Learn. Practice. Grow.
            </div>
          </div>
        </div>

        <div className="sidebar-scroll">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-title">
                {group.title}
              </div>

              {group.items.map((item) => {
                const isActive =
                  activeSection === item.id;

                const isFun = item.id === "fun";

                return (
                  <button
                    key={item.id}
                    className={`nav-item ${
                      isActive ? "nav-item-active" : ""
                    }`}
                    onClick={() => {
                      if (isFun && !studyUnlocked) {
                        navigate("fun");
                        return;
                      }

                      navigate(item.id as Section);
                    }}
                  >
                    <span className="nav-icon">
                      {item.icon}
                    </span>

                    <span>{item.label}</span>

                    {isFun && !studyUnlocked && (
                      <span className="lock-small">
                        🔒
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="mini-focus">
            <div className="mini-focus-top">
              <span>Focus session</span>
              <span>
                {studyUnlocked ? "✓" : formatTime(studySeconds)}
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    (studySeconds / STUDY_GOAL) * 100
                  )}%`,
                }}
              />
            </div>

            <div className="mini-focus-text">
              {studyUnlocked
                ? "Fun Zone unlocked 🎉"
                : "30 min to unlock games"}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  function renderHeader(title: string, subtitle?: string) {
    return (
      <div className="page-header">
        <div>
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="eyebrow">STUDYONE</div>

          <h1>{title}</h1>

          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    );
  }

  /* ---------------- HOME ---------------- */

  function renderHome() {
    return (
      <section className="home-section">
        <div className="home-top">
          <div>
            <div className="eyebrow">WELCOME BACK</div>

            <h1>
              Study smarter.
              <br />
              <span>One step at a time.</span>
            </h1>

            <p className="home-description">
              Your AI-powered study space for planning,
              practicing and improving.
            </p>
          </div>

          <div className="thought-card">
            <div className="thought-icon">✦</div>

            <div>
              <div className="thought-label">
                TODAY'S THOUGHT
              </div>

              <div className="thought-text">
                {thoughtMessages[thoughtIndex]}
              </div>
            </div>
          </div>
        </div>

        <div className="ai-card">
          <div className="ai-card-header">
            <div className="ai-avatar">✦</div>

            <div>
              <h2>StudyOne AI</h2>
              <p>Your personal study companion</p>
            </div>

            <div className="ai-status">
              <span />
              Online
            </div>
          </div>

          <div className="chat-area">
            {chatMessages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-chat-icon">🧠</div>

                <h3>What are we studying today?</h3>

                <p>
                  Ask me to explain a concept, build a study
                  plan, quiz you, or help you revise.
                </p>
              </div>
            ) : (
              <div className="messages">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${
                      message.role === "user"
                        ? "message-user"
                        : "message-ai"
                    }`}
                  >
                    <div className="message-avatar">
                      {message.role === "user"
                        ? "Y"
                        : "✦"}
                    </div>

                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="message message-ai">
                    <div className="message-avatar">✦</div>

                    <div className="typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="quick-prompts">
            <button
              onClick={() =>
                sendChatMessage(
                  "Make me a realistic study plan for today."
                )
              }
            >
              📅 Make a plan
            </button>

            <button
              onClick={() =>
                sendChatMessage(
                  "Explain a difficult science concept in simple language."
                )
              }
            >
              💡 Explain a topic
            </button>

            <button
              onClick={() =>
                sendChatMessage(
                  "Give me a quick revision session."
                )
              }
            >
              ⚡ Quick revision
            </button>

            <button
              onClick={() =>
                navigate("quiz")
              }
            >
              🧠 Start a quiz
            </button>
          </div>

          <div className="chat-input-wrap">
            <textarea
              value={chatInput}
              onChange={(event) =>
                setChatInput(event.target.value)
              }
              onKeyDown={handleChatKeyDown}
              placeholder="Ask StudyOne anything..."
              rows={1}
            />

            <button
              className="send-button"
              onClick={() => sendChatMessage()}
              disabled={!chatInput.trim() || chatLoading}
            >
              ➤
            </button>
          </div>

          <div className="chat-hint">
            Press Enter to send • Shift + Enter for a new line
          </div>
        </div>

        <div className="home-grid">
          <div className="home-card focus-card">
            <div className="home-card-icon">⏱</div>

            <div className="home-card-heading">
              <h3>Focus Session</h3>

              <span className="focus-time">
                {formatTime(studySeconds)}
              </span>
            </div>

            <p>
              {studyUnlocked
                ? "Your 30-minute focus goal is complete."
                : "Study for 30 minutes to unlock Fun Zone."}
            </p>

            <div className="progress-track large">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    (studySeconds / STUDY_GOAL) * 100
                  )}%`,
                }}
              />
            </div>

            <div className="focus-status">
              {studyUnlocked
                ? "🔓 Fun Zone unlocked"
                : `${Math.floor(
                    studySeconds / 60
                  )} / 30 minutes`}
            </div>
          </div>

          <div className="home-card">
            <div className="home-card-icon">📊</div>

            <h3>Your Progress</h3>

            <p>
              {progress.totalQuizzes === 0
                ? "Complete your first quiz to start tracking your progress."
                : `${progress.totalQuizzes} quizzes completed with ${progress.averageAccuracy}% average accuracy.`}
            </p>

            <button
              className="text-button"
              onClick={() => navigate("progress")}
            >
              View progress →
            </button>
          </div>

          <div className="home-card">
            <div className="home-card-icon">❌</div>

            <h3>Weak Areas</h3>

            <p>
              {mistakes.length === 0
                ? "Mistakes you make in quizzes will appear here."
                : `You have ${mistakes.length} saved mistake${
                    mistakes.length === 1 ? "" : "s"
                  } to practice.`}
            </p>

            <button
              className="text-button"
              onClick={() => navigate("mistakes")}
            >
              Review mistakes →
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- PLANNER PAGE ---------------- */

  function renderPlanner() {
    return (
      <section className="page-section">
        {renderHeader(
          "Study Planner",
          "Build a realistic AI-powered plan around your exam."
        )}

        <div className="two-column">
          <div className="panel">
            <div className="panel-title">
              <span>📅</span>
              <div>
                <h2>Planner Setup</h2>
                <p>Tell StudyOne what you need to prepare.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Class
                <select
                  value={className}
                  onChange={(event) =>
                    setClassName(event.target.value)
                  }
                >
                  <option>Class 10</option>
                  <option>Class 9</option>
                  <option>Class 11</option>
                  <option>Class 12</option>
                </select>
              </label>

              <label>
                Board
                <select
                  value={board}
                  onChange={(event) =>
                    setBoard(event.target.value)
                  }
                >
                  <option>MP Board</option>
                  <option>CBSE</option>
                  <option>ICSE</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Exam date
                <input
                  type="date"
                  value={examDate}
                  onChange={(event) =>
                    setExamDate(event.target.value)
                  }
                />
              </label>

              <label>
                Daily study time
                <select
                  value={studyTime}
                  onChange={(event) =>
                    setStudyTime(event.target.value)
                  }
                >
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>3 hours</option>
                  <option>4 hours</option>
                  <option>5+ hours</option>
                </select>
              </label>

              <label className="full">
                Subjects
                <textarea
                  value={subjects}
                  onChange={(event) =>
                    setSubjects(event.target.value)
                  }
                  placeholder="Example: Maths, Science, English, Social Science"
                  rows={4}
                />
              </label>
            </div>

            <button
              className="primary-button"
              onClick={createPlan}
              disabled={planLoading}
            >
              {planLoading
                ? "Creating plan..."
                : "✦ Build my plan"}
            </button>
          </div>

          <div className="panel output-panel">
            <div className="panel-title">
              <span>✦</span>

              <div>
                <h2>AI Study Plan</h2>
                <p>Your personalized preparation plan.</p>
              </div>
            </div>

            {plan ? (
              <div className="ai-output">{plan}</div>
            ) : (
              <div className="empty-output">
                <div>📚</div>
                <p>
                  Your study plan will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- QUIZ PAGE ---------------- */

  function renderQuiz() {
    if (quizFinished) {
      const total = quizQuestions.length;
      const accuracy =
        total > 0
          ? Math.round((quizScore / total) * 100)
          : 0;

      return (
        <section className="page-section">
          {renderHeader(
            "Quiz Complete",
            "Here's how you performed."
          )}

          <div className="result-card">
            <div className="result-icon">
              {accuracy >= 80
                ? "🏆"
                : accuracy >= 50
                ? "✨"
                : "📚"}
            </div>

            <div className="result-score">
              {quizScore}/{total}
            </div>

            <h2>
              {accuracy >= 80
                ? "Excellent work!"
                : accuracy >= 50
                ? "Good progress!"
                : "Keep practicing!"}
            </h2>

            <p>
              You scored {accuracy}% in this{" "}
              {quizType.toLowerCase()}.
            </p>

            <div className="result-actions">
              <button
                className="primary-button"
                onClick={resetQuiz}
              >
                Try another quiz
              </button>

              <button
                className="secondary-button"
                onClick={() => navigate("mistakes")}
              >
                Review mistakes
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (quizStarted && quizQuestions.length > 0) {
      const current = quizQuestions[quizIndex];

      return (
        <section className="page-section">
          {renderHeader(
            quizType,
            `${quizIndex + 1} of ${quizQuestions.length}`
          )}

          <div className="quiz-panel">
            <div className="quiz-progress">
              <div
                style={{
                  width: `${
                    ((quizIndex + 1) /
                      quizQuestions.length) *
                    100
                  }%`,
                }}
              />
            </div>

            <div className="quiz-meta">
              <span>
                {quizSubject}
                {quizChapter
                  ? ` • ${quizChapter}`
                  : ""}
              </span>

              <span>
                Score: {quizScore}
              </span>
            </div>

            <h2 className="quiz-question">
              {current.question}
            </h2>

            <div className="quiz-options">
              {current.options.map((option, index) => {
                const isSelected =
                  selectedAnswer === option;
                const isCorrect =
                  option === current.answer;

                let className = "quiz-option";

                if (showExplanation) {
                  if (isCorrect) {
                    className += " correct";
                  } else if (isSelected) {
                    className += " wrong";
                  }
                } else if (isSelected) {
                  className += " selected";
                }

                return (
                  <button
                    key={option}
                    className={className}
                    onClick={() =>
                      chooseAnswer(option)
                    }
                    disabled={showExplanation}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span>{option}</span>

                    {showExplanation &&
                      isCorrect && (
                        <span className="option-result">
                          ✓
                        </span>
                      )}

                    {showExplanation &&
                      isSelected &&
                      !isCorrect && (
                        <span className="option-result">
                          ×
                        </span>
                      )}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="explanation">
                <strong>
                  {selectedAnswer === current.answer
                    ? "Correct! "
                    : "Not quite. "}
                </strong>

                {current.explanation}
              </div>
            )}

            {showExplanation && (
              <button
                className="primary-button next-button"
                onClick={nextQuestion}
              >
                {quizIndex === quizQuestions.length - 1
                  ? "Finish quiz"
                  : "Next question →"}
              </button>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="page-section">
        {renderHeader(
          "AI Quiz",
          "Generate a fresh 5-question practice quiz."
        )}

        <div className="two-column">
          <div className="panel">
            <div className="panel-title">
              <span>🧠</span>

              <div>
                <h2>Quiz Setup</h2>
                <p>
                  Choose what you want to practice.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <label className="full">
                Subject
                <input
                  value={quizSubject}
                  onChange={(event) =>
                    setQuizSubject(event.target.value)
                  }
                  placeholder="Example: Science"
                />
              </label>

              <label className="full">
                Chapter
                <input
                  value={quizChapter}
                  onChange={(event) =>
                    setQuizChapter(event.target.value)
                  }
                  placeholder="Optional chapter name"
                />
              </label>
            </div>

            <button
              className="primary-button"
              onClick={() => startQuiz(false)}
              disabled={quizLoading}
            >
              {quizLoading
                ? "Generating quiz..."
                : "✦ Generate AI Quiz"}
            </button>

            {mistakes.length > 0 && (
              <button
                className="secondary-button full-button"
                onClick={() => startQuiz(true)}
                disabled={quizLoading}
              >
                🧠 Practice My Mistakes
              </button>
            )}
          </div>

          <div className="panel quiz-info">
            <div className="big-icon">✦</div>

            <h2>How it works</h2>

            <div className="info-step">
              <span>01</span>
              <div>
                <strong>Choose a subject</strong>
                <p>Pick what you want to practice.</p>
              </div>
            </div>

            <div className="info-step">
              <span>02</span>
              <div>
                <strong>AI creates 5 questions</strong>
                <p>
                  Questions are generated for your
                  class and board.
                </p>
              </div>
            </div>

            <div className="info-step">
              <span>03</span>
              <div>
                <strong>Learn from mistakes</strong>
                <p>
                  Wrong answers are saved for later
                  practice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- PDF PAGE ---------------- */

  function renderPdf() {
    return (
      <section className="page-section">
        {renderHeader(
          "PDF Notes",
          "Turn your chapter PDF into simple exam-focused notes."
        )}

        <div className="two-column">
          <div className="panel">
            <div className="panel-title">
              <span>📄</span>

              <div>
                <h2>Upload Chapter</h2>
                <p>PDF files up to 10 MB.</p>
              </div>
            </div>

            <label className="upload-box">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) =>
                  setPdfFile(
                    event.target.files?.[0] || null
                  )
                }
              />

              <div className="upload-icon">↑</div>

              <strong>
                {pdfFile
                  ? pdfFile.name
                  : "Choose a PDF file"}
              </strong>

              <span>
                Click here to upload your chapter.
              </span>
            </label>

            <label>
              What should StudyOne create?
              <textarea
                value={pdfPrompt}
                onChange={(event) =>
                  setPdfPrompt(event.target.value)
                }
                rows={5}
              />
            </label>

            <button
              className="primary-button"
              onClick={generatePdfNotes}
              disabled={pdfLoading}
            >
              {pdfLoading
                ? "Reading PDF..."
                : "✦ Generate Notes"}
            </button>
          </div>

          <div className="panel output-panel">
            <div className="panel-title">
              <span>📚</span>

              <div>
                <h2>Study Notes</h2>
                <p>Generated from your PDF.</p>
              </div>
            </div>

            {pdfNotes ? (
              <div className="ai-output">
                {pdfNotes}
              </div>
            ) : (
              <div className="empty-output">
                <div>📖</div>
                <p>
                  Upload a chapter to generate notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- REVISION PAGE ---------------- */

  function renderRevision() {
    return (
      <section className="page-section">
        {renderHeader(
          "Quick Revision",
          "Use StudyOne AI for short, focused revision sessions."
        )}

        <div className="revision-grid">
          <button
            className="revision-card"
            onClick={() =>
              sendChatMessage(
                "Give me a 10-minute quick revision session for an important topic."
              )
            }
          >
            <div>⚡</div>
            <h3>10-Minute Revision</h3>
            <p>
              Fast revision with key points and questions.
            </p>
          </button>

          <button
            className="revision-card"
            onClick={() =>
              sendChatMessage(
                "Teach me the most important concepts I should revise today."
              )
            }
          >
            <div>🧠</div>
            <h3>Key Concepts</h3>
            <p>
              Focus on the concepts that matter most.
            </p>
          </button>

          <button
            className="revision-card"
            onClick={() =>
              sendChatMessage(
                "Give me important exam-style questions for revision."
              )
            }
          >
            <div>🎯</div>
            <h3>Exam Questions</h3>
            <p>
              Practice short exam-focused questions.
            </p>
          </button>

          <button
            className="revision-card"
            onClick={() =>
              sendChatMessage(
                "Explain a difficult topic in very simple language and give me a memory trick."
              )
            }
          >
            <div>💡</div>
            <h3>Explain Simply</h3>
            <p>
              Turn difficult concepts into easy explanations.
            </p>
          </button>
        </div>

        <div className="panel revision-tip">
          <div className="tip-icon">✦</div>

          <div>
            <h3>Revision rule</h3>
            <p>
              Don't try to reread everything. Focus on
              concepts you forget, questions you get wrong,
              and topics that repeatedly cause confusion.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- EXAM MODE ---------------- */

  function renderExam() {
    return (
      <section className="page-section">
        {renderHeader(
          "Exam Mode",
          "A focused environment for serious practice."
        )}

        <div className="exam-hero">
          <div className="exam-icon">◎</div>

          <h2>Ready for the boss level?</h2>

          <p>
            Exam Mode can be used for timed practice,
            question practice and final revision.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("quiz")}
          >
            Start Practice Quiz →
          </button>
        </div>

        <div className="exam-grid">
          <div className="panel">
            <div className="home-card-icon">⏱</div>
            <h3>Timed Practice</h3>
            <p>
              Give yourself a fixed amount of time and
              practice without distractions.
            </p>
          </div>

          <div className="panel">
            <div className="home-card-icon">🎯</div>
            <h3>Exam Focus</h3>
            <p>
              Use AI Quiz and your mistakes to target
              the areas that need attention.
            </p>
          </div>

          <div className="panel">
            <div className="home-card-icon">📊</div>
            <h3>Track Results</h3>
            <p>
              Your quiz results are automatically added
              to your progress dashboard.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- PROGRESS PAGE ---------------- */

  function renderProgress() {
    return (
      <section className="page-section">
        {renderHeader(
          "Progress",
          "See how your preparation is developing over time."
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span>QUIZZES</span>
            <strong>{progress.totalQuizzes}</strong>
          </div>

          <div className="stat-card">
            <span>QUESTIONS</span>
            <strong>{progress.totalQuestions}</strong>
          </div>

          <div className="stat-card">
            <span>ACCURACY</span>
            <strong>{progress.averageAccuracy}%</strong>
          </div>

          <div className="stat-card">
            <span>STUDY STREAK</span>
            <strong>
              {streak.current}
              <small> days</small>
            </strong>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="panel">
            <div className="panel-title">
              <span>📈</span>

              <div>
                <h2>Recent Performance</h2>
                <p>Your last five quiz results.</p>
              </div>
            </div>

            {quizHistory.length === 0 ? (
              <div className="empty-output">
                <div>📊</div>
                <p>
                  Complete a quiz to start seeing your
                  performance.
                </p>
              </div>
            ) : (
              <div className="chart">
                {quizHistory
                  .slice(0, 5)
                  .reverse()
                  .map((quiz) => (
                    <div
                      className="chart-item"
                      key={quiz.id}
                    >
                      <div className="chart-value">
                        {quiz.accuracy}%
                      </div>

                      <div className="chart-bar-area">
                        <div
                          className="chart-bar"
                          style={{
                            height: `${Math.max(
                              8,
                              quiz.accuracy
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="chart-label">
                        {quiz.subject.slice(0, 10)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">
              <span>🔥</span>

              <div>
                <h2>Streak</h2>
                <p>Consistency beats cramming.</p>
              </div>
            </div>

            <div className="streak-big">
              <strong>{streak.current}</strong>
              <span>day streak</span>
            </div>

            <div className="streak-best">
              Best streak: <strong>{streak.best} days</strong>
            </div>

            <div className="progress-message">
              {progress.averageAccuracy >= 90
                ? "Excellent consistency. Keep this momentum."
                : progress.averageAccuracy >= 75
                ? "Strong progress. Keep sharpening weak areas."
                : progress.averageAccuracy >= 50
                ? "You're building progress. More practice will help."
                : "Focus on your mistakes and keep practicing."}
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="panel">
            <div className="panel-title">
              <span>📚</span>

              <div>
                <h2>Subject Performance</h2>
                <p>Accuracy by subject.</p>
              </div>
            </div>

            {progress.subjectPerformance.length === 0 ? (
              <div className="empty-output">
                <p>No subject data yet.</p>
              </div>
            ) : (
              <div className="subject-list">
                {progress.subjectPerformance.map(
                  (item) => (
                    <div
                      className="subject-row"
                      key={item.subject}
                    >
                      <div className="subject-row-top">
                        <span>{item.subject}</span>
                        <strong>
                          {item.accuracy}%
                        </strong>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${item.accuracy}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">
              <span>🎯</span>

              <div>
                <h2>Focus Area</h2>
                <p>Where your attention should go next.</p>
              </div>
            </div>

            {progress.weakestSubject ? (
              <>
                <div className="focus-subject">
                  <span>Needs attention</span>
                  <strong>
                    {progress.weakestSubject.subject}
                  </strong>
                  <div>
                    {progress.weakestSubject.accuracy}%
                    accuracy
                  </div>
                </div>

                <p className="focus-description">
                  Practice this subject again and review
                  your saved mistakes.
                </p>
              </>
            ) : (
              <div className="empty-output">
                <div>🎯</div>
                <p>
                  Complete some quizzes and StudyOne will
                  identify your focus area.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <span>🕘</span>

            <div>
              <h2>Recent Quizzes</h2>
              <p>Your latest practice sessions.</p>
            </div>
          </div>

          {quizHistory.length === 0 ? (
            <div className="empty-output">
              <p>No quizzes completed yet.</p>
            </div>
          ) : (
            <div className="history-list">
              {quizHistory.slice(0, 8).map((quiz) => (
                <div
                  className="history-item"
                  key={quiz.id}
                >
                  <div>
                    <strong>{quiz.subject}</strong>
                    <span>
                      {quiz.chapter} • {quiz.type}
                    </span>
                  </div>

                  <div className="history-score">
                    <strong>
                      {quiz.score}/{quiz.total}
                    </strong>
                    <span>{quiz.accuracy}%</span>
                  </div>

                  <div className="history-date">
                    {formatDate(
                      quiz.completedAt || quiz.date
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="danger-button"
          onClick={clearProgress}
        >
          Reset Quiz Progress
        </button>
      </section>
    );
  }

  /* ---------------- MISTAKES PAGE ---------------- */

  function renderMistakes() {
    return (
      <section className="page-section">
        {renderHeader(
          "Mistakes",
          "Turn mistakes into your strongest revision material."
        )}

        <div className="mistake-header">
          <div>
            <strong>{mistakes.length}</strong>
            <span>saved mistakes</span>
          </div>

          <div className="mistake-actions">
            {mistakes.length > 0 && (
              <>
                <button
                  className="primary-button"
                  onClick={() => {
                    setQuizSubject(
                      mistakes[0]?.subject || ""
                    );
                    navigate("quiz");
                  }}
                >
                  🧠 Practice mistakes
                </button>

                <button
                  className="danger-button"
                  onClick={clearMistakes}
                >
                  Clear mistakes
                </button>
              </>
            )}
          </div>
        </div>

        {mistakes.length === 0 ? (
          <div className="empty-large">
            <div>✓</div>
            <h2>No mistakes saved yet</h2>
            <p>
              Complete an AI Quiz. Incorrect answers will
              automatically appear here.
            </p>

            <button
              className="primary-button"
              onClick={() => navigate("quiz")}
            >
              Start a quiz
            </button>
          </div>
        ) : (
          <div className="mistake-list">
            {mistakes.map((mistake, index) => (
              <div
                className="mistake-card"
                key={mistake.id}
              >
                <div className="mistake-number">
                  {mistakes.length - index}
                </div>

                <div className="mistake-content">
                  <div className="mistake-meta">
                    <span>{mistake.subject}</span>
                    <span>{mistake.chapter}</span>
                    <span>
                      {formatDate(mistake.date)}
                    </span>
                  </div>

                  <h3>{mistake.question}</h3>

                  <div className="answer-row wrong-answer">
                    <span>Your answer</span>
                    <strong>
                      {mistake.yourAnswer}
                    </strong>
                  </div>

                  <div className="answer-row correct-answer">
                    <span>Correct answer</span>
                    <strong>
                      {mistake.correctAnswer}
                    </strong>
                  </div>

                  <div className="mistake-explanation">
                    <strong>Why?</strong>
                    <p>{mistake.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  /* ---------------- FUN ZONE ---------------- */

  function renderFun() {
    const progressPercent = Math.min(
      100,
      (studySeconds / STUDY_GOAL) * 100
    );

    if (!studyUnlocked) {
      return (
        <section className="page-section">
          {renderHeader(
            "Fun Zone",
            "Your study break is waiting for you."
          )}

          <div className="locked-zone">
            <div className="lock-icon">🔒</div>

            <div className="eyebrow">
              REWARD LOCK
            </div>

            <h2>
              Study first.
              <br />
              <span>Then play.</span>
            </h2>

            <p>
              Complete a 30-minute focus session to
              unlock the Fun Zone.
            </p>

            <div className="unlock-progress">
              <div className="unlock-time">
                <strong>
                  {formatTime(studySeconds)}
                </strong>

                <span>/ 30:00</span>
              </div>

              <div className="progress-track large">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>

              <span className="unlock-percent">
                {Math.round(progressPercent)}% complete
              </span>
            </div>

            <button
              className="secondary-button"
              onClick={() => navigate("home")}
            >
              ← Back to studying
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="page-section">
        {renderHeader(
          "Fun Zone",
          "You earned a short brain break. 🎉"
        )}

        <div className="unlocked-banner">
          <div className="unlock-banner-icon">🔓</div>

          <div>
            <strong>Fun Zone unlocked!</strong>
            <p>
              Nice work completing your 30-minute focus
              session.
            </p>
          </div>
        </div>

        <div className="games-grid">
          <div className="game-card">
            <div className="game-icon">⚡</div>

            <h3>Reaction Challenge</h3>

            <p>
              Wait for the signal, then click as fast as
              you can.
            </p>

            <button
              className={`game-button ${
                reactionReady ? "reaction-ready" : ""
              }`}
              onClick={
                reactionStarted
                  ? clickReaction
                  : startReactionGame
              }
            >
              {reactionStarted
                ? reactionReady
                  ? "CLICK!"
                  : "Wait..."
                : "Start"}
            </button>

            {reactionResult !== null && (
              <div className="game-result">
                {reactionResult === -1
                  ? "Too early! 😭"
                  : `${reactionResult} ms`}
              </div>
            )}
          </div>

          <div className="game-card">
            <div className="game-icon">🧠</div>

            <h3>Memory Match</h3>

            <p>
              Match all the pairs using as few moves as
              possible.
            </p>

            {memoryCards.length === 0 ? (
              <button
                className="game-button"
                onClick={createMemoryGame}
              >
                Start
              </button>
            ) : (
              <>
                <div className="memory-grid">
                  {memoryCards.map((card) => (
                    <button
                      key={card.id}
                      className={`memory-card ${
                        card.flipped || card.matched
                          ? "memory-card-flipped"
                          : ""
                      }`}
                      onClick={() =>
                        flipMemoryCard(card.id)
                      }
                    >
                      {card.flipped || card.matched
                        ? card.value
                        : "?"}
                    </button>
                  ))}
                </div>

                <div className="game-result">
                  Moves: {memoryMoves}
                </div>
              </>
            )}
          </div>

          <div className="game-card">
            <div className="game-icon">🔢</div>

            <h3>Number Challenge</h3>

            <p>
              Find the hidden number from 1 to 100.
            </p>

            {numberTarget === null ? (
              <button
                className="game-button"
                onClick={startNumberGame}
              >
                Start
              </button>
            ) : (
              <>
                <div className="number-input-row">
                  <input
                    type="number"
                    value={numberInput}
                    onChange={(event) =>
                      setNumberInput(event.target.value)
                    }
                    placeholder="Your guess"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        checkNumberGuess();
                      }
                    }}
                  />

                  <button
                    className="game-button small"
                    onClick={checkNumberGuess}
                  >
                    Guess
                  </button>
                </div>

                <div className="game-result">
                  {numberMessage}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="break-note">
          <span>🌱</span>

          <div>
            <strong>Keep your break short.</strong>
            <p>
              Fun Zone is designed as a reward after
              focused study, not a replacement for it.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- SETTINGS ---------------- */

  function renderSettings() {
    return (
      <section className="page-section">
        {renderHeader(
          "Settings",
          "Manage your StudyOne preferences."
        )}

        <div className="settings-list">
          <div className="settings-card">
            <div>
              <strong>Student profile</strong>
              <p>
                These details are used when generating
                AI study plans and quizzes.
              </p>
            </div>

            <div className="settings-values">
              <span>{className}</span>
              <span>{board}</span>
            </div>
          </div>

          <div className="settings-card">
            <div>
              <strong>Fun Zone</strong>
              <p>
                Games unlock after the 30-minute focus
                goal is completed.
              </p>
            </div>

            <span className="settings-badge">
              30 min
            </span>
          </div>

          <div className="settings-card">
            <div>
              <strong>Saved data</strong>
              <p>
                StudyOne stores quiz history, mistakes,
                chat history and focus progress locally
                in your browser.
              </p>
            </div>

            <span className="settings-badge">
              Local
            </span>
          </div>

          <div className="settings-card">
            <div>
              <strong>Reset everything</strong>
              <p>
                Remove local StudyOne progress from this
                browser.
              </p>
            </div>

            <button
              className="danger-button"
              onClick={() => {
                const confirmed = window.confirm(
                  "Reset StudyOne data from this browser?"
                );

                if (!confirmed) return;

                localStorage.removeItem(
                  "studyone_mistakes"
                );
                localStorage.removeItem(
                  "studyone_quiz_history"
                );
                localStorage.removeItem(
                  "studyone_study_seconds"
                );
                localStorage.removeItem(
                  "studyone_chat"
                );

                setMistakes([]);
                setQuizHistory([]);
                setStudySeconds(0);
                setChatMessages([]);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderContent() {
    switch (activeSection) {
      case "home":
        return renderHome();

      case "planner":
        return renderPlanner();

      case "quiz":
        return renderQuiz();

      case "pdf":
        return renderPdf();

      case "revision":
        return renderRevision();

      case "exam":
        return renderExam();

      case "progress":
        return renderProgress();

      case "mistakes":
        return renderMistakes();

      case "fun":
        return renderFun();

      case "settings":
        return renderSettings();

      default:
        return renderHome();
    }
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #08070d;
          color: #f4f2fa;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          display: flex;
          background:
            radial-gradient(
              circle at 70% 0%,
              rgba(124, 58, 237, 0.11),
              transparent 30%
            ),
            #08070d;
        }

        /* SIDEBAR */

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 260px;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(10, 9, 16, 0.96);
          display: flex;
          flex-direction: column;
          z-index: 50;
          backdrop-filter: blur(20px);
        }

        .brand {
          height: 88px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .brand-mark {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6d28d9
          );
          color: white;
          font-weight: 900;
          font-size: 20px;
          box-shadow:
            0 8px 30px rgba(124, 58, 237, 0.3);
        }

        .brand-name {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .brand-subtitle {
          margin-top: 2px;
          font-size: 11px;
          color: #777385;
        }

        .sidebar-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 18px 12px;
        }

        .nav-group {
          margin-bottom: 24px;
        }

        .nav-title {
          padding: 0 11px;
          margin-bottom: 7px;
          color: #666171;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .nav-item {
          width: 100%;
          height: 44px;
          border: 0;
          background: transparent;
          color: #a9a4b4;
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 10px;
          padding: 0 12px;
          text-align: left;
          margin-bottom: 3px;
          transition:
            background 0.2s,
            color 0.2s,
            transform 0.2s;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #eeeaf7;
        }

        .nav-item-active {
          background: rgba(124, 58, 237, 0.16);
          color: #c4a7ff;
        }

        .nav-icon {
          width: 20px;
          text-align: center;
          font-size: 17px;
        }

        .lock-small {
          margin-left: auto;
          font-size: 11px;
        }

        .sidebar-bottom {
          padding: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .mini-focus {
          padding: 13px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .mini-focus-top {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #aaa5b4;
          margin-bottom: 9px;
        }

        .mini-focus-text {
          margin-top: 8px;
          font-size: 10px;
          color: #777385;
        }

        /* MAIN */

        .main {
          width: calc(100% - 260px);
          margin-left: 260px;
          min-height: 100vh;
        }

        .content {
          width: min(1180px, 100%);
          margin: 0 auto;
          padding: 44px 40px 80px;
        }

        .mobile-menu {
          display: none;
        }

        .eyebrow {
          color: #8b5cf6;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 9px;
        }

        /* HOME */

        .home-section {
          padding-top: 20px;
        }

        .home-top {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          align-items: flex-end;
          margin-bottom: 34px;
        }

        .home-top h1 {
          margin: 0;
          font-size: clamp(38px, 5vw, 62px);
          line-height: 0.98;
          letter-spacing: -3px;
        }

        .home-top h1 span {
          color: #9b7cff;
        }

        .home-description {
          max-width: 570px;
          color: #888291;
          margin: 20px 0 0;
          line-height: 1.7;
          font-size: 15px;
        }

        .thought-card {
          max-width: 320px;
          display: flex;
          gap: 13px;
          padding: 17px;
          border: 1px solid rgba(139, 92, 246, 0.18);
          background: rgba(124, 58, 237, 0.07);
          border-radius: 16px;
        }

        .thought-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.16);
          color: #b69aff;
        }

        .thought-label {
          color: #766d87;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
          margin-bottom: 7px;
        }

        .thought-text {
          color: #c9c3d4;
          line-height: 1.45;
          font-size: 13px;
        }

        /* AI */

        .ai-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(124, 58, 237, 0.12),
              transparent 45%
            ),
            rgba(17, 15, 25, 0.9);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.2);
        }

        .ai-card-header {
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 13px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .ai-avatar {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #8b5cf6,
            #6d28d9
          );
          color: white;
          font-size: 20px;
        }

        .ai-card-header h2 {
          margin: 0;
          font-size: 16px;
        }

        .ai-card-header p {
          margin: 3px 0 0;
          color: #746e80;
          font-size: 12px;
        }

        .ai-status {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #787283;
          font-size: 11px;
        }

        .ai-status span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #65d391;
          box-shadow: 0 0 10px rgba(101, 211, 145, 0.5);
        }

        .chat-area {
          min-height: 280px;
          max-height: 430px;
          overflow-y: auto;
          padding: 28px;
        }

        .empty-chat {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #777182;
        }

        .empty-chat-icon {
          font-size: 38px;
          margin-bottom: 13px;
        }

        .empty-chat h3 {
          color: #d8d3df;
          margin: 0 0 7px;
          font-size: 20px;
        }

        .empty-chat p {
          max-width: 460px;
          margin: 0;
          line-height: 1.6;
          font-size: 13px;
        }

        .messages {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .message {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .message-user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: rgba(139, 92, 246, 0.15);
          color: #b99cff;
          font-size: 12px;
          font-weight: 800;
        }

        .message-user .message-avatar {
          background: rgba(255, 255, 255, 0.07);
          color: #aaa4b4;
        }

        .message-content {
          max-width: 75%;
          padding: 11px 14px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.04);
          color: #c8c2d2;
          line-height: 1.6;
          font-size: 13px;
          white-space: pre-wrap;
        }

        .message-user .message-content {
          background: rgba(124, 58, 237, 0.16);
          color: #ded7ec;
        }

        .typing {
          display: flex;
          gap: 5px;
          padding: 12px 4px;
        }

        .typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8b5cf6;
          animation: typing 1s infinite ease-in-out;
        }

        .typing span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes typing {
          0%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }

          50% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        .quick-prompts {
          padding: 0 24px 17px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .quick-prompts button {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.035);
          color: #aaa4b4;
          padding: 8px 11px;
          border-radius: 9px;
          font-size: 11px;
        }

        .quick-prompts button:hover {
          border-color: rgba(139, 92, 246, 0.35);
          color: #c8b7e8;
        }

        .chat-input-wrap {
          margin: 0 18px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(5, 5, 9, 0.7);
          border-radius: 14px;
          padding: 7px;
        }

        .chat-input-wrap textarea {
          flex: 1;
          resize: none;
          min-height: 40px;
          max-height: 130px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #eeeaf4;
          padding: 10px;
        }

        .chat-input-wrap textarea::placeholder {
          color: #625d6a;
        }

        .send-button {
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 10px;
          background: #7c3aed;
          color: white;
          font-size: 16px;
        }

        .send-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .chat-hint {
          text-align: center;
          padding: 8px 10px 13px;
          color: #514c59;
          font-size: 9px;
        }

        /* HOME CARDS */

        .home-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 16px;
        }

        .home-card {
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(17, 15, 25, 0.65);
          border-radius: 16px;
        }

        .home-card-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.11);
          margin-bottom: 14px;
        }

        .home-card h3 {
          margin: 0;
          font-size: 15px;
        }

        .home-card p {
          margin: 8px 0 0;
          color: #777182;
          line-height: 1.6;
          font-size: 12px;
        }

        .focus-card {
          grid-column: span 1;
        }

        .home-card-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .focus-time {
          color: #a78bfa;
          font-size: 13px;
          font-weight: 800;
        }

        .focus-status {
          margin-top: 8px;
          color: #777182;
          font-size: 10px;
        }

        .text-button {
          border: 0;
          background: transparent;
          color: #9c7cff;
          padding: 13px 0 0;
          font-size: 11px;
          font-weight: 700;
        }

        /* PAGE */

        .page-section {
          padding-top: 10px;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 38px;
          letter-spacing: -1.8px;
        }

        .page-header p {
          margin: 8px 0 0;
          color: #777182;
          font-size: 14px;
        }

        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .panel {
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(17, 15, 25, 0.68);
          border-radius: 18px;
          padding: 23px;
        }

        .panel-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
        }

        .panel-title > span {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.12);
        }

        .panel-title h2 {
          margin: 0;
          font-size: 16px;
        }

        .panel-title p {
          margin: 4px 0 0;
          color: #706a79;
          font-size: 11px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #8f8998;
          font-size: 11px;
          font-weight: 700;
        }

        label.full {
          grid-column: 1 / -1;
        }

        input,
        textarea,
        select {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          outline: none;
          background: rgba(5, 5, 9, 0.7);
          color: #eeeaf4;
          border-radius: 10px;
          padding: 11px 12px;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: rgba(139, 92, 246, 0.5);
        }

        textarea {
          resize: vertical;
          line-height: 1.6;
        }

        .primary-button,
        .secondary-button,
        .danger-button {
          border-radius: 10px;
          padding: 11px 15px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
          margin-top: 17px;
        }

        .primary-button {
          background: #7c3aed;
          color: white;
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.18);
        }

        .primary-button:hover {
          background: #8b5cf6;
        }

        .primary-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.05);
          color: #c4becd;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .danger-button {
          background: rgba(239, 68, 68, 0.08);
          color: #ef9b9b;
          border-color: rgba(239, 68, 68, 0.14);
        }

        .full-button {
          width: 100%;
        }

        .output-panel {
          min-height: 450px;
        }

        .ai-output {
          color: #c3bdcc;
          line-height: 1.75;
          white-space: pre-wrap;
          font-size: 13px;
        }

        .empty-output {
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          color: #625d6a;
          gap: 8px;
          font-size: 12px;
        }

        .empty-output > div {
          font-size: 34px;
          opacity: 0.7;
        }

        /* PDF */

        .upload-box {
          min-height: 180px;
          border: 1px dashed rgba(139, 92, 246, 0.35);
          border-radius: 15px;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
          cursor: pointer;
          margin-bottom: 18px;
          background: rgba(124, 58, 237, 0.035);
        }

        .upload-box input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .upload-icon {
          font-size: 27px;
          margin-bottom: 8px;
        }

        .upload-box strong {
          font-size: 13px;
          color: #bbb4c6;
        }

        .upload-box span {
          color: #676170;
          font-size: 10px;
          margin-top: 5px;
        }

        /* QUIZ */

        .quiz-panel {
          max-width: 820px;
          margin: 0 auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(17, 15, 25, 0.8);
          border-radius: 20px;
          padding: 28px;
        }

        .quiz-progress {
          width: 100%;
          height: 5px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .quiz-progress > div {
          height: 100%;
          background: #8b5cf6;
          transition: width 0.3s;
        }

        .quiz-meta {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 17px;
          color: #746e7e;
          font-size: 11px;
        }

        .quiz-question {
          margin: 35px 0 24px;
          font-size: 24px;
          line-height: 1.4;
        }

        .quiz-options {
          display: grid;
          gap: 10px;
        }

        .quiz-option {
          min-height: 58px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.025);
          color: #bdb7c6;
          border-radius: 12px;
          padding: 10px 13px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .quiz-option:hover {
          border-color: rgba(139, 92, 246, 0.4);
        }

        .quiz-option.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }

        .quiz-option.correct {
          border-color: rgba(74, 222, 128, 0.4);
          background: rgba(74, 222, 128, 0.08);
        }

        .quiz-option.wrong {
          border-color: rgba(248, 113, 113, 0.4);
          background: rgba(248, 113, 113, 0.08);
        }

        .option-letter {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #817b8a;
          font-size: 11px;
          font-weight: 800;
        }

        .option-result {
          margin-left: auto;
          font-size: 17px;
        }

        .explanation {
          margin-top: 18px;
          padding: 14px;
          border-radius: 11px;
          background: rgba(139, 92, 246, 0.07);
          color: #a7a0b1;
          font-size: 12px;
          line-height: 1.6;
        }

        .next-button {
          display: block;
          margin-left: auto;
        }

        .quiz-info {
          min-height: 450px;
        }

        .big-icon {
          font-size: 40px;
          margin-bottom: 20px;
        }

        .quiz-info h2 {
          margin: 0 0 25px;
        }

        .info-step {
          display: flex;
          gap: 13px;
          margin-bottom: 22px;
        }

        .info-step > span {
          color: #8b5cf6;
          font-size: 10px;
          font-weight: 900;
          padding-top: 2px;
        }

        .info-step strong {
          font-size: 12px;
        }

        .info-step p {
          margin: 5px 0 0;
          color: #716b79;
          font-size: 11px;
          line-height: 1.5;
        }

        /* RESULT */

        .result-card {
          max-width: 600px;
          margin: 70px auto;
          padding: 45px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(17, 15, 25, 0.8);
          border-radius: 22px;
          text-align: center;
        }

        .result-icon {
          font-size: 50px;
        }

        .result-score {
          margin-top: 15px;
          font-size: 55px;
          font-weight: 900;
          letter-spacing: -3px;
        }

        .result-card h2 {
          margin: 5px 0;
        }

        .result-card p {
          color: #756f7e;
          font-size: 13px;
        }

        .result-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        /* PROGRESS */

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(17, 15, 25, 0.65);
          border-radius: 15px;
        }

        .stat-card span {
          display: block;
          color: #696371;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .stat-card strong {
          display: block;
          margin-top: 9px;
          font-size: 29px;
          letter-spacing: -1px;
        }

        .stat-card small {
          color: #726c79;
          font-size: 10px;
          font-weight: 500;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .chart {
          height: 250px;
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 12px;
          padding: 20px 10px 0;
        }

        .chart-item {
          height: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
        }

        .chart-value {
          color: #9d7cff;
          font-size: 10px;
          font-weight: 800;
        }

        .chart-bar-area {
          height: 180px;
          width: min(55px, 100%);
          display: flex;
          align-items: flex-end;
          background: rgba(255, 255, 255, 0.025);
          border-radius: 8px 8px 3px 3px;
          overflow: hidden;
        }

        .chart-bar {
          width: 100%;
          background: linear-gradient(
            to top,
            #6d28d9,
            #a78bfa
          );
          border-radius: 8px 8px 0 0;
        }

        .chart-label {
          max-width: 70px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #686270;
          font-size: 9px;
        }

        .streak-big {
          padding: 30px 0 12px;
          text-align: center;
        }

        .streak-big strong {
          display: block;
          font-size: 60px;
          line-height: 1;
          color: #a78bfa;
        }

        .streak-big span {
          color: #777182;
          font-size: 12px;
        }

        .streak-best {
          text-align: center;
          color: #6f6977;
          font-size: 11px;
        }

        .streak-best strong {
          color: #aaa3b4;
        }

        .progress-message {
          margin-top: 25px;
          padding: 13px;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.07);
          color: #a59eae;
          font-size: 11px;
          line-height: 1.5;
          text-align: center;
        }

        .subject-list {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .subject-row-top {
          display: flex;
          justify-content: space-between;
          color: #aaa4b3;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .subject-row-top strong {
          color: #a78bfa;
        }

        .progress-track {
          height: 6px;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.06);
        }

        .progress-track.large {
          height: 8px;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #6d28d9,
            #a78bfa
          );
          transition: width 0.4s;
        }

        .focus-subject {
          margin-top: 30px;
          padding: 20px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.1);
        }

        .focus-subject span {
          display: block;
          color: #82727a;
          font-size: 10px;
          margin-bottom: 7px;
        }

        .focus-subject strong {
          display: block;
          font-size: 25px;
        }

        .focus-subject div {
          margin-top: 5px;
          color: #d28b8b;
          font-size: 11px;
        }

        .focus-description {
          color: #756f7d;
          font-size: 11px;
          line-height: 1.6;
        }

        .history-list {
          display: flex;
          flex-direction: column;
        }

        .history-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 15px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .history-item:last-child {
          border-bottom: 0;
        }

        .history-item strong {
          display: block;
          font-size: 12px;
        }

        .history-item span {
          display: block;
          margin-top: 4px;
          color: #676170;
          font-size: 10px;
        }

        .history-score {
          text-align: right;
        }

        .history-score span {
          color: #9d7cff;
        }

        .history-date {
          color: #625d6a;
          font-size: 10px;
        }

        /* MISTAKES */

        .mistake-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .mistake-header > div:first-child {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .mistake-header strong {
          font-size: 32px;
        }

        .mistake-header span {
          color: #716b79;
          font-size: 11px;
        }

        .mistake-actions {
          display: flex;
          gap: 8px;
        }

        .mistake-actions button {
          margin-top: 0;
        }

        .mistake-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mistake-card {
          display: flex;
          gap: 17px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(17, 15, 25, 0.68);
          border-radius: 15px;
        }

        .mistake-number {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.08);
          color: #d98a8a;
          font-size: 10px;
          font-weight: 800;
        }

        .mistake-content {
          flex: 1;
        }

        .mistake-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 10px;
        }

        .mistake-meta span {
          padding: 4px 7px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: #706a78;
          font-size: 9px;
        }

        .mistake-content h3 {
          margin: 0 0 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .answer-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 9px 11px;
          border-radius: 8px;
          margin-top: 6px;
          font-size: 10px;
        }

        .answer-row span {
          color: #77717f;
        }

        .wrong-answer {
          background: rgba(239, 68, 68, 0.05);
        }

        .wrong-answer strong {
          color: #d48d8d;
        }

        .correct-answer {
          background: rgba(74, 222, 128, 0.05);
        }

        .correct-answer strong {
          color: #87c99d;
        }

        .mistake-explanation {
          margin-top: 14px;
          color: #77717f;
          font-size: 11px;
          line-height: 1.6;
        }

        .mistake-explanation p {
          margin: 5px 0 0;
        }

        .empty-large {
          min-height: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 18px;
        }

        .empty-large > div {
          width: 60px;
          height: 60px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: rgba(74, 222, 128, 0.08);
          color: #7fc595;
          font-size: 28px;
          margin-bottom: 16px;
        }

        .empty-large h2 {
          margin: 0;
          font-size: 19px;
        }

        .empty-large p {
          max-width: 400px;
          color: #716b79;
          font-size: 12px;
          line-height: 1.6;
        }

        /* REVISION */

        .revision-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .revision-card {
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(17, 15, 25, 0.68);
          color: #eeeaf4;
          text-align: left;
          border-radius: 17px;
          padding: 24px;
        }

        .revision-card:hover {
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-2px);
        }

        .revision-card > div {
          font-size: 25px;
          margin-bottom: 15px;
        }

        .revision-card h3 {
          margin: 0;
          font-size: 16px;
        }

        .revision-card p {
          margin: 8px 0 0;
          color: #706a79;
          line-height: 1.6;
          font-size: 11px;
        }

        .revision-tip {
          margin-top: 15px;
          display: flex;
          gap: 15px;
        }

        .tip-icon {
          color: #a78bfa;
          font-size: 22px;
        }

        .revision-tip h3 {
          margin: 0;
          font-size: 13px;
        }

        .revision-tip p {
          color: #746e7c;
          font-size: 11px;
          line-height: 1.6;
        }

        /* EXAM */

        .exam-hero {
          padding: 55px 30px;
          text-align: center;
          border: 1px solid rgba(139, 92, 246, 0.14);
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(124, 58, 237, 0.13),
              transparent 55%
            ),
            rgba(17, 15, 25, 0.7);
          border-radius: 20px;
        }

        .exam-icon {
          font-size: 45px;
          color: #a78bfa;
        }

        .exam-hero h2 {
          margin: 16px 0 7px;
          font-size: 28px;
        }

        .exam-hero p {
          max-width: 550px;
          margin: auto;
          color: #756f7d;
          line-height: 1.6;
          font-size: 12px;
        }

        .exam-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 15px;
        }

        .exam-grid .panel {
          min-height: 170px;
        }

        /* FUN */

        .locked-zone {
          min-height: 570px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background:
            radial-gradient(
              circle at 50% 30%,
              rgba(124, 58, 237, 0.09),
              transparent 42%
            ),
            rgba(17, 15, 25, 0.68);
          border-radius: 22px;
          padding: 35px;
        }

        .lock-icon {
          width: 76px;
          height: 76px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background: rgba(139, 92, 246, 0.1);
          font-size: 32px;
          margin-bottom: 24px;
        }

        .locked-zone h2 {
          margin: 0;
          font-size: 39px;
          line-height: 1.05;
          letter-spacing: -1.8px;
        }

        .locked-zone h2 span {
          color: #9d7cff;
        }

        .locked-zone > p {
          max-width: 470px;
          color: #756f7d;
          font-size: 13px;
          line-height: 1.6;
          margin: 15px 0 25px;
        }

        .unlock-progress {
          width: min(500px, 100%);
        }

        .unlock-time {
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: 5px;
          margin-bottom: 12px;
        }

        .unlock-time strong {
          font-size: 28px;
          color: #c5b4e8;
        }

        .unlock-time span {
          color: #66606e;
          font-size: 11px;
        }

        .unlock-percent {
          display: block;
          margin-top: 8px;
          color: #625d6a;
          font-size: 10px;
        }

        .unlocked-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 17px;
          border: 1px solid rgba(74, 222, 128, 0.13);
          background: rgba(74, 222, 128, 0.05);
          border-radius: 14px;
          margin-bottom: 16px;
        }

        .unlock-banner-icon {
          font-size: 28px;
        }

        .unlocked-banner strong {
          font-size: 14px;
        }

        .unlocked-banner p {
          margin: 4px 0 0;
          color: #718077;
          font-size: 11px;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .game-card {
          min-height: 330px;
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(17, 15, 25, 0.7);
          border-radius: 17px;
          display: flex;
          flex-direction: column;
        }

        .game-icon {
          font-size: 31px;
          margin-bottom: 15px;
        }

        .game-card h3 {
          margin: 0;
          font-size: 16px;
        }

        .game-card > p {
          color: #716b79;
          font-size: 11px;
          line-height: 1.6;
          min-height: 48px;
        }

        .game-button {
          margin-top: auto;
          min-height: 42px;
          border: 0;
          border-radius: 10px;
          background: #7c3aed;
          color: white;
          font-size: 12px;
          font-weight: 800;
        }

        .game-button.small {
          margin-top: 0;
          padding: 0 13px;
        }

        .reaction-ready {
          background: #dc2626;
          animation: pulse 0.8s infinite;
        }

        @keyframes pulse {
          50% {
            transform: scale(1.015);
          }
        }

        .game-result {
          text-align: center;
          margin-top: 12px;
          color: #a78bfa;
          font-size: 12px;
          font-weight: 700;
        }

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 10px;
        }

        .memory-card {
          aspect-ratio: 1;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.035);
          color: #77717f;
          border-radius: 7px;
          font-weight: 800;
        }

        .memory-card-flipped {
          background: rgba(139, 92, 246, 0.14);
          color: #bda6ec;
        }

        .number-input-row {
          display: flex;
          gap: 7px;
          margin-top: 18px;
        }

        .number-input-row input {
          min-width: 0;
        }

        .break-note {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          color: #756f7d;
          font-size: 11px;
        }

        .break-note span {
          font-size: 20px;
        }

        .break-note strong {
          color: #aaa3b2;
        }

        .break-note p {
          margin: 4px 0 0;
        }

        /* SETTINGS */

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .settings-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(17, 15, 25, 0.68);
          border-radius: 15px;
        }

        .settings-card strong {
          font-size: 13px;
        }

        .settings-card p {
          margin: 5px 0 0;
          color: #706a78;
          font-size: 11px;
          line-height: 1.5;
        }

        .settings-values {
          display: flex;
          gap: 7px;
        }

        .settings-values span,
        .settings-badge {
          padding: 6px 8px;
          border-radius: 7px;
          background: rgba(139, 92, 246, 0.1);
          color: #a78bfa;
          font-size: 10px;
          white-space: nowrap;
        }

        .settings-card .danger-button {
          margin: 0;
        }

        /* RESPONSIVE */

        @media (max-width: 1000px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }

          .sidebar-open {
            transform: translateX(0);
          }

          .main {
            width: 100%;
            margin-left: 0;
          }

          .content {
            padding: 28px 20px 60px;
          }

          .mobile-menu {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            margin-bottom: 18px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 9px;
            background: rgba(255, 255, 255, 0.04);
            color: #aaa4b4;
          }

          .home-grid,
          .games-grid,
          .exam-grid {
            grid-template-columns: 1fr 1fr;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 720px) {
          .home-top {
            flex-direction: column;
            align-items: stretch;
          }

          .home-top h1 {
            font-size: 42px;
          }

          .thought-card {
            max-width: none;
          }

          .two-column,
          .home-grid,
          .revision-grid,
          .games-grid,
          .exam-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          label.full {
            grid-column: auto;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .page-header h1 {
            font-size: 31px;
          }

          .quiz-question {
            font-size: 20px;
          }

          .quiz-panel {
            padding: 19px;
          }

          .result-actions {
            flex-direction: column;
          }

          .mistake-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 15px;
          }

          .history-item {
            grid-template-columns: 1fr auto;
          }

          .history-date {
            grid-column: 1 / -1;
          }

          .settings-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .locked-zone h2 {
            font-size: 31px;
          }

          .chat-area {
            min-height: 250px;
            padding: 20px;
          }

          .message-content {
            max-width: 85%;
          }
        }

        @media (max-width: 430px) {
          .content {
            padding-left: 14px;
            padding-right: 14px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .home-top h1 {
            font-size: 37px;
          }

          .ai-card-header {
            padding: 17px;
          }

          .ai-status {
            display: none;
          }

          .quick-prompts {
            padding-left: 17px;
            padding-right: 17px;
          }

          .chat-input-wrap {
            margin: 0 12px;
          }

          .panel {
            padding: 18px;
          }
        }
      `}</style>

      <div className="app">
        {renderSidebar()}

        <main className="main">
          <div className="content">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
}