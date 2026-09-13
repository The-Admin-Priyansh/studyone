"use client";

import { useMemo, useState } from "react";

export default function Home() {
  // ==========================================
  // PLANNER
  // ==========================================

  const [className, setClassName] = useState("Class 10");
  const [board, setBoard] = useState("MP Board");
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState("");
  const [studyTime, setStudyTime] = useState("1 hour");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // AI ASSISTANT
  // ==========================================

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ==========================================
  // PDF NOTES
  // ==========================================

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfNotes, setPdfNotes] = useState("");

  // ==========================================
  // SUBJECT LIST
  // ==========================================

  const subjectList = useMemo(() => {
    return subjects
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);
  }, [subjects]);

  // ==========================================
  // CREATE STUDY PLAN
  // ==========================================

  async function createPlan() {
    if (!examDate) {
      setPlan("Please select your exam date.");
      return;
    }

    if (subjectList.length === 0) {
      setPlan("Please enter at least one subject.");
      return;
    }

    setLoading(true);
    setPlan("");

    const prompt = `
Create a complete day-by-day study plan for a student.

Student details:
Class: ${className}
Board: ${board}
Exam date: ${examDate}
Subjects: ${subjectList.join(", ")}
Available study time per day: ${studyTime}

STRICT RULES:
- Create an actual day-by-day plan from TODAY until the exact exam date.
- Do NOT create a reusable 7-day template.
- Do NOT say "repeat this cycle".
- Use the actual number of days available.
- Include all provided subjects.
- Rotate subjects intelligently.
- Do not exceed the selected daily study time.
- Breaks do not count toward study time.
- Do not invent chapters or topics that the student has not provided.
- If chapters are not provided, use general study activities such as revision, practice, formulas, definitions and questions.
- Keep the plan realistic for the student's class and board.
- As the exam gets closer, increase revision and practice.
- Include lighter days when appropriate.
- Do not create an unrealistic full-day timetable.
- Do not add unnecessary laboratory experiments.
- Do not change the exam date.
- Use simple, clear formatting.
`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not create plan.");
      }

      setPlan(data.answer);
    } catch (error) {
      console.error(error);
      setPlan("Could not create the study plan right now.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // AI ASSISTANT
  // ==========================================

  async function askAI() {
    if (!aiQuestion.trim()) {
      setAiAnswer("Please enter a question.");
      return;
    }

    setAiLoading(true);
    setAiAnswer("");

    const prompt = `
You are StudyOne AI.

Student:
Class: ${className}
Board: ${board}

Student question:
${aiQuestion}

Give a simple and useful answer suitable for the student's class.
Explain difficult concepts step-by-step.
Do not invent syllabus information.
`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI assistant failed.");
      }

      setAiAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setAiAnswer("AI Assistant is currently unavailable.");
    } finally {
      setAiLoading(false);
    }
  }

  // ==========================================
  // PDF FILE SELECT
  // ==========================================

  function handlePdfChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setPdfFile(null);
      setPdfNotes("Please select a PDF file only.");
      return;
    }

    setPdfFile(file);
    setPdfNotes("");
  }

  // ==========================================
  // PDF → NOTES + VISUAL LEARNING
  // ==========================================

  async function generatePdfNotes() {
    if (!pdfFile) {
      setPdfNotes("Please select a chapter PDF first.");
      return;
    }

    setPdfLoading(true);
    setPdfNotes("");

    try {
      const formData = new FormData();

      formData.append("file", pdfFile);

      formData.append(
        "prompt",
        `
Create exam-focused chapter notes from this PDF.

IMPORTANT:
Use ONLY information actually present in the PDF.
Do NOT add outside facts.
Do NOT invent examples.
Do NOT invent formulas.
Do NOT invent dates or names.

Organize the response exactly like this:

# 📚 Chapter Notes

## 1. Chapter Overview
Give a short overview based only on the PDF.

## 2. Important Concepts
List the most important concepts from the PDF.

## 3. Important Definitions
Give important definitions from the PDF.

## 4. Key Points
Give the most important points for revision.

## 5. Important Facts / Dates / Names
Only include them if they are present in the PDF.

## 6. Formulas
Only include formulas actually present in the PDF.
If there are no formulas, write:
"No specific formulas found in the provided text."

## 7. Examples
Only include examples present in the PDF.

## 8. Exam Revision
Give important exam-oriented points and questions based ONLY on the PDF.

# 🖼️ Visual Learning

After the notes, identify concepts from the PDF where a visual explanation would genuinely help.

For each useful concept, use this format:

### Visual 1: [Concept]
**Type:** Diagram / 3D Visual / Animation
**Why useful:** Explain briefly why seeing it would help.
**What the visual should show:** Describe only information supported by the PDF.

If no visual is useful, write:
"No visual explanation is necessary for this chapter."

# 🎥 Video Ideas

Suggest short educational video ideas ONLY for concepts found in the PDF.

For each one:

### Video 1: [Concept]
**Length:** 20-40 seconds
**Style:** 2D / 3D / Animation
**Explanation:** Describe what the video should teach using only the PDF content.

If no video is useful, write:
"No video explanation is necessary."

Remember:
TEXT NOTES ARE THE PRIMARY LEARNING METHOD.
Visuals and videos are SECONDARY.
Do not add unrelated visuals or information.
        `.trim()
      );

      const response = await fetch("/api/ai", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not generate notes.");
      }

      setPdfNotes(data.answer);
    } catch (error) {
      console.error(error);

      setPdfNotes(
        "PDF notes could not be generated. Please check the server/API error."
      );
    } finally {
      setPdfLoading(false);
    }
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #17122b 0%, #09090b 45%, #050505 100%)",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* NAVBAR */}

      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 7%",
          borderBottom: "1px solid #27272a",
          position: "sticky",
          top: 0,
          background: "rgba(5,5,5,0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: "24px",
            fontWeight: "800",
          }}
        >
          Study<span style={{ color: "#8b5cf6" }}>One</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "18px",
            fontSize: "14px",
            flexWrap: "wrap",
          }}
        >
          <a href="#planner" style={{ color: "#d4d4d8", textDecoration: "none" }}>
            Planner
          </a>

          <a href="#pdf-notes" style={{ color: "#d4d4d8", textDecoration: "none" }}>
            PDF Notes
          </a>

          <a href="#assistant" style={{ color: "#d4d4d8", textDecoration: "none" }}>
            AI Assistant
          </a>
        </div>
      </nav>

      {/* HERO */}

      <section
        style={{
          padding: "90px 7% 70px",
          textAlign: "center",
          maxWidth: "1000px",
          margin: "auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "7px 13px",
            border: "1px solid #3f3f46",
            borderRadius: "999px",
            color: "#a78bfa",
            fontSize: "12px",
            letterSpacing: "1px",
            marginBottom: "20px",
          }}
        >
          AI-POWERED STUDY PLATFORM
        </div>

        <h1
          style={{
            fontSize: "clamp(42px, 7vw, 76px)",
            lineHeight: "1",
            margin: "0",
            fontWeight: "900",
          }}
        >
          Study smarter.
          <br />
          <span style={{ color: "#8b5cf6" }}>Not harder.</span>
        </h1>

        <p
          style={{
            color: "#a1a1aa",
            maxWidth: "650px",
            margin: "25px auto 0",
            lineHeight: "1.7",
            fontSize: "17px",
          }}
        >
          Build study plans, turn chapter PDFs into notes, and understand
          difficult concepts with AI-powered learning.
        </p>
      </section>

      {/* FEATURES */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          padding: "0 7% 80px",
          maxWidth: "1200px",
          margin: "auto",
        }}
      >
        {[
          ["🧠", "Smart Study Plan", "Create realistic day-by-day plans."],
          ["📚", "PDF to Notes", "Turn chapters into exam-focused notes."],
          ["🖼️", "Visual Learning", "Find concepts that benefit from visuals."],
          ["🤖", "AI Assistant", "Ask questions and learn faster."],
        ].map(([icon, title, description]) => (
          <div
            key={title}
            style={{
              padding: "24px",
              border: "1px solid #27272a",
              borderRadius: "18px",
              background: "rgba(24,24,27,0.7)",
            }}
          >
            <div style={{ fontSize: "30px", marginBottom: "12px" }}>
              {icon}
            </div>

            <h3 style={{ margin: "0 0 8px" }}>{title}</h3>

            <p
              style={{
                margin: 0,
                color: "#a1a1aa",
                lineHeight: "1.5",
                fontSize: "14px",
              }}
            >
              {description}
            </p>
          </div>
        ))}
      </section>

      {/* PLANNER */}

      <section
        id="planner"
        style={{
          padding: "70px 7%",
          maxWidth: "1000px",
          margin: "auto",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              color: "#8b5cf6",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            MVP PLANNER
          </div>

          <h2 style={{ fontSize: "38px", margin: "8px 0" }}>
            Build my plan
          </h2>

          <p style={{ color: "#a1a1aa" }}>
            Tell StudyOne what you need to study.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px",
          }}
        >
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            style={inputStyle}
          >
            {Array.from({ length: 7 }, (_, i) => `Class ${i + 6}`).map(
              (item) => (
                <option key={item}>{item}</option>
              )
            )}
          </select>

          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            style={inputStyle}
          >
            <option>MP Board</option>
            <option>CBSE</option>
            <option>ICSE</option>
            <option>Other</option>
          </select>

          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            style={inputStyle}
          />

          <select
            value={studyTime}
            onChange={(e) => setStudyTime(e.target.value)}
            style={inputStyle}
          >
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>1.5 hours</option>
            <option>2 hours</option>
            <option>3 hours</option>
            <option>4 hours</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Subjects: Maths, Science, English..."
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
          style={{
            ...inputStyle,
            width: "100%",
            marginTop: "15px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={createPlan}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "Creating plan..." : "Build my plan →"}
        </button>

        {plan && (
          <div style={resultStyle}>
            <h3 style={{ marginTop: 0 }}>📅 Your Study Plan</h3>

            <pre style={preStyle}>{plan}</pre>
          </div>
        )}
      </section>

      {/* PDF NOTES */}

      <section
        id="pdf-notes"
        style={{
          padding: "80px 7%",
          background: "rgba(139,92,246,0.04)",
          borderTop: "1px solid #18181b",
          borderBottom: "1px solid #18181b",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "auto",
          }}
        >
          <div
            style={{
              color: "#8b5cf6",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            LEARN FROM YOUR CHAPTER
          </div>

          <h2
            style={{
              fontSize: "38px",
              margin: "8px 0",
            }}
          >
            📄 PDF → Notes → Visual Learning
          </h2>

          <p
            style={{
              color: "#a1a1aa",
              lineHeight: "1.6",
              maxWidth: "700px",
            }}
          >
            Upload one chapter PDF. StudyOne will create text notes first,
            then identify concepts where a diagram, 3D visual or short
            animation could make understanding easier.
          </p>

          <div
            style={{
              marginTop: "30px",
              padding: "28px",
              border: "1px solid #27272a",
              borderRadius: "20px",
              background: "#09090b",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "12px",
                fontWeight: "700",
              }}
            >
              Choose chapter PDF
            </label>

            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePdfChange}
              style={{
                width: "100%",
                color: "#d4d4d8",
              }}
            />

            {pdfFile && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "#18181b",
                  color: "#d4d4d8",
                  fontSize: "14px",
                }}
              >
                📄 <strong>{pdfFile.name}</strong>
                <br />
                <span style={{ color: "#71717a" }}>
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}

            <button
              onClick={generatePdfNotes}
              disabled={pdfLoading}
              style={buttonStyle}
            >
              {pdfLoading
                ? "Reading chapter..."
                : "Generate Notes + Visuals →"}
            </button>
          </div>

          {pdfNotes && (
            <div
              style={{
                marginTop: "25px",
                padding: "30px",
                border: "1px solid #27272a",
                borderRadius: "20px",
                background: "#09090b",
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  color: "#8b5cf6",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  marginBottom: "15px",
                }}
              >
                STUDYONE AI OUTPUT
              </div>

              <pre
                style={{
                  ...preStyle,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {pdfNotes}
              </pre>

              <div
                style={{
                  marginTop: "25px",
                  padding: "18px",
                  borderRadius: "14px",
                  border: "1px solid #312e81",
                  background: "rgba(49,46,129,0.12)",
                }}
              >
                <strong>🧠 Learning flow</strong>

                <p
                  style={{
                    color: "#a1a1aa",
                    marginBottom: 0,
                    lineHeight: "1.7",
                  }}
                >
                  📝 Read the text first → 🖼️ understand with a visual when
                  useful → 🎥 use animation/video for difficult concepts →
                  ❓ test yourself.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI ASSISTANT */}

      <section
        id="assistant"
        style={{
          padding: "80px 7%",
          maxWidth: "1000px",
          margin: "auto",
        }}
      >
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          STUDYONE AI
        </div>

        <h2
          style={{
            fontSize: "38px",
            margin: "8px 0",
          }}
        >
          🤖 Ask anything
        </h2>

        <p style={{ color: "#a1a1aa" }}>
          Get simple explanations based on your class and board.
        </p>

        <textarea
          placeholder="Ask a study question..."
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          rows={5}
          style={{
            ...inputStyle,
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            marginTop: "20px",
          }}
        />

        <button
          onClick={askAI}
          disabled={aiLoading}
          style={buttonStyle}
        >
          {aiLoading ? "Thinking..." : "Ask StudyOne AI →"}
        </button>

        {aiAnswer && (
          <div style={resultStyle}>
            <h3 style={{ marginTop: 0 }}>💡 Answer</h3>

            <pre
              style={{
                ...preStyle,
                whiteSpace: "pre-wrap",
              }}
            >
              {aiAnswer}
            </pre>
          </div>
        )}
      </section>

      {/* FOOTER */}

      <footer
        style={{
          padding: "35px 7%",
          borderTop: "1px solid #27272a",
          textAlign: "center",
          color: "#71717a",
          fontSize: "13px",
        }}
      >
        StudyOne • Learn smarter 📚
      </footer>
    </main>
  );
}

// ==========================================
// STYLES
// ==========================================

const inputStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "12px",
  padding: "14px",
  color: "#fff",
  outline: "none",
  fontSize: "14px",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px 22px",
  border: "none",
  borderRadius: "12px",
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: "800",
  cursor: "pointer",
  fontSize: "14px",
};

const resultStyle: React.CSSProperties = {
  marginTop: "25px",
  padding: "25px",
  border: "1px solid #27272a",
  borderRadius: "18px",
  background: "#09090b",
};

const preStyle: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  color: "#d4d4d8",
  lineHeight: "1.7",
  margin: 0,
  whiteSpace: "pre-wrap",
};