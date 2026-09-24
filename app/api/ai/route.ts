import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const apiKey = process.env.GROQ_API_KEY;

const groq = apiKey
  ? new Groq({
      apiKey,
    })
  : null;

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type RecallQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

function aiUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "GROQ_API_KEY is missing in the server environment.",
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    // =========================================================
    // CHECK GROQ CONFIG
    // =========================================================

    if (!groq) {
      console.error(
        "StudyOne AI ERROR: GROQ_API_KEY is missing."
      );

      return aiUnavailableResponse();
    }

    const contentType =
      request.headers.get("content-type") || "";

    // =========================================================
    // PDF NOTES
    // =========================================================

    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      /*
        IMPORTANT:
        Load pdf-parse only for PDF requests.
        This prevents normal AI requests from
        needing pdf-parse.
      */
      const { PDFParse } = await import(
        "pdf-parse"
      );

      const formData =
        await request.formData();

      const file =
        formData.get("file");

      const prompt =
        formData.get("prompt");

      if (!(file instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please upload a PDF file.",
          },
          { status: 400 }
        );
      }

      if (
        file.type !==
          "application/pdf" &&
        !file.name
          .toLowerCase()
          .endsWith(".pdf")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only PDF files are supported.",
          },
          { status: 400 }
        );
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "PDF is too large. Please upload a PDF under 10 MB.",
          },
          { status: 400 }
        );
      }

      const arrayBuffer =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(arrayBuffer);

      const parser =
        new PDFParse({
          data: buffer,
        });

      const parsed =
        await parser.getText();

      await parser.destroy();

      const pdfText =
        parsed.text?.trim();

      if (!pdfText) {
        return NextResponse.json(
          {
            success: false,
            error:
              "I couldn't extract readable text from this PDF. It may be a scanned or image-only PDF.",
          },
          { status: 400 }
        );
      }

      /*
        Limit prompt size so extremely large PDFs
        don't create huge requests.
      */
      const limitedText =
        pdfText.slice(0, 50000);

      const completion =
        await groq.chat.completions.create(
          {
            model:
              "openai/gpt-oss-20b",

            messages: [
              {
                role: "system",
                content: `
You are StudyOne AI, an exam-focused study assistant for school students.

Your job is to convert the provided chapter PDF text into clear and useful study notes.

IMPORTANT RULES:

1. Use ONLY information present in the provided PDF text.
2. Do NOT invent facts, definitions, examples, formulas, dates, names or topics.
3. Keep the original meaning of the source.
4. Make the notes simple and easy for students to understand.
5. Use clear headings and bullet points.
6. Include important definitions.
7. Include important concepts.
8. Include formulas if present.
9. Include important dates, names and examples when present.
10. Highlight exam-important information.
11. Add important questions only from the provided content.
12. Do not use HTML.
13. Do not make up missing information.
14. If something is unclear or missing, say so instead of guessing.
15. Do NOT use markdown tables.
16. Prefer headings, bullets and short sections.
                `.trim(),
              },

              {
                role: "user",
                content: `
${
  typeof prompt === "string"
    ? prompt
    : "Create simple, exam-focused notes from this PDF."
}

PDF CONTENT:

================ PDF START ================

${limitedText}

================ PDF END ==================

Now create the study notes.

Remember:
Use only the information contained in the PDF.
Do not add outside facts.
Do not guess missing information.
                `.trim(),
              },
            ],
          }
        );

      const answer =
        completion.choices[0]
          ?.message
          ?.content ||
        "Sorry, I couldn't generate notes from this PDF.";

      return NextResponse.json({
        success: true,
        answer,
      });
    }

    // =========================================================
    // NORMAL JSON REQUEST
    // =========================================================

    const body =
      await request.json();

    // =========================================================
    // STUDY SESSION RECALL
    // =========================================================

    if (
      body?.mode === "recall"
    ) {
      const className =
        typeof body.className ===
        "string"
          ? body.className
          : "Class 10";

      const board =
        typeof body.board ===
        "string"
          ? body.board
          : "MP Board";

      const subject =
        typeof body.subject ===
        "string"
          ? body.subject.trim()
          : "";

      const chapter =
        typeof body.chapter ===
        "string"
          ? body.chapter.trim()
          : "";

      if (!subject) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please provide the subject studied during the session.",
          },
          { status: 400 }
        );
      }

      if (!chapter) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please provide the chapter or topic studied during the session.",
          },
          { status: 400 }
        );
      }

      const recallPrompt = `
Create exactly ONE multiple-choice recall question for a student who has just completed a focused study session.

Student:

Class:
${className}

Board:
${board}

Subject:
${subject}

Chapter / Topic:
${chapter}

This is a quick memory check after studying.

IMPORTANT RULES:

- Create exactly 1 question.
- Create exactly 4 options.
- There must be exactly ONE correct answer.
- The question should test an important thing from the provided subject/chapter/topic.
- Keep the question suitable for ${className}.
- Keep the question clear and not unnecessarily tricky.
- Do not invent a specific textbook chapter name.
- Do not use markdown.
- Return ONLY valid JSON.

Return exactly:

{
  "question": "Question text",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "answer": "Exactly the correct option text",
  "explanation": "Short explanation"
}

Before returning, check:

- exactly one question
- exactly four options
- answer matches one option exactly
- explanation is short
      `.trim();

      const completion =
        await groq.chat.completions.create(
          {
            model:
              "openai/gpt-oss-20b",

            messages: [
              {
                role: "system",
                content:
                  "You are StudyOne's strict study-session recall generator. Return valid JSON only.",
              },

              {
                role: "user",
                content:
                  recallPrompt,
              },
            ],

            temperature: 0.2,

            response_format: {
              type: "json_object",
            },
          }
        );

      const rawAnswer =
        completion.choices[0]
          ?.message
          ?.content
          ?.trim();

      console.log(
        "RECALL RAW RESPONSE:",
        rawAnswer
      );

      if (!rawAnswer) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The AI returned an empty recall question.",
          },
          { status: 500 }
        );
      }

      let parsed: unknown;

      try {
        parsed =
          JSON.parse(rawAnswer);
      } catch (error) {
        console.error(
          "RECALL JSON PARSE ERROR:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "The AI returned invalid recall question data.",
          },
          { status: 500 }
        );
      }

      if (
        typeof parsed !==
          "object" ||
        parsed === null
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The AI returned an invalid recall question.",
          },
          { status: 500 }
        );
      }

      const recall =
        parsed as Partial<RecallQuestion>;

      if (
        typeof recall.question !==
          "string" ||
        !Array.isArray(
          recall.options
        ) ||
        recall.options.length !==
          4 ||
        !recall.options.every(
          (option) =>
            typeof option ===
            "string"
        ) ||
        typeof recall.answer !==
          "string" ||
        typeof recall.explanation !==
          "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The AI generated an incomplete recall question.",
          },
          { status: 500 }
        );
      }

      if (
        !recall.options.includes(
          recall.answer
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The AI generated an invalid recall answer.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        question: {
          question:
            recall.question,
          options:
            recall.options,
          answer:
            recall.answer,
          explanation:
            recall.explanation,
        },
      });
    }

    // =========================================================
    // AI QUIZ
    // =========================================================

    if (
      body?.mode === "quiz"
    ) {
      const className =
        typeof body.className ===
        "string"
          ? body.className
          : "Class 10";

      const board =
        typeof body.board ===
        "string"
          ? body.board
          : "MP Board";

      const subject =
        typeof body.subject ===
        "string"
          ? body.subject
          : "";

      const chapter =
        typeof body.chapter ===
        "string"
          ? body.chapter
          : "";

      const practiceMistakes =
        body.practiceMistakes ===
        true;

      const mistakes =
        Array.isArray(
          body.mistakes
        )
          ? body.mistakes
          : [];

      if (!subject.trim()) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please provide a subject.",
          },
          { status: 400 }
        );
      }

      const mistakesText =
        mistakes
          .slice(-10)
          .map(
            (
              mistake: {
                question?: string;
                yourAnswer?: string;
                correctAnswer?: string;
                explanation?: string;
              },
              index: number
            ) =>
              `
Mistake ${index + 1}

Question:
${mistake.question || ""}

Student answer:
${mistake.yourAnswer || ""}

Correct answer:
${mistake.correctAnswer || ""}

Explanation:
${mistake.explanation || ""}
`
          )
          .join("\n");

      const quizPrompt = `
Create exactly 5 multiple-choice questions for StudyOne.

Student:

Class:
${className}

Board:
${board}

Subject:
${subject}

Chapter:
${chapter.trim() || "Not specified"}

${
  practiceMistakes
    ? `
IMPORTANT:

This is a WEAK AREA PRACTICE QUIZ.

The student previously made these mistakes:

${mistakesText}

Create NEW questions that test the same concepts the student struggled with.

Do NOT simply copy the previous questions.

The goal is to help the student understand and improve their weak areas.
`
    : ""
}

IMPORTANT RULES:

- Create exactly 5 questions.
- Each question must have exactly 4 options.
- There must be exactly ONE correct answer.
- Questions must be suitable for ${className}.
- Keep questions useful for exam preparation.
- Mix easy, medium and difficult questions.
- If a chapter is provided, focus on that chapter.
- Do not invent a specific textbook chapter name.
- Keep explanations short and clear.
- Do not use markdown.
- Do not use markdown tables.
- Return ONLY valid JSON.
- Do not put JSON inside markdown code fences.

Return exactly:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": "Exactly the correct option text",
      "explanation": "Short explanation"
    }
  ]
}

Before returning the JSON, check:

- Exactly 5 question objects.
- Every object has question.
- Every object has options.
- Every options array has exactly 4 strings.
- Every object has answer.
- Every answer exactly matches one option.
- Every object has explanation.
      `.trim();

      const completion =
        await groq.chat.completions.create(
          {
            model:
              "openai/gpt-oss-20b",

            messages: [
              {
                role: "system",
                content:
                  "You are StudyOne's strict quiz generator. Return valid JSON only.",
              },

              {
                role: "user",
                content:
                  quizPrompt,
              },
            ],

            temperature: 0.2,

            response_format: {
              type: "json_object",
            },
          }
        );

      const rawAnswer =
        completion.choices[0]
          ?.message
          ?.content
          ?.trim();

      console.log(
        "QUIZ RAW RESPONSE:",
        rawAnswer
      );

      if (!rawAnswer) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The AI returned an empty quiz.",
          },
          { status: 500 }
        );
      }

      let parsed: unknown;

      try {
        parsed =
          JSON.parse(rawAnswer);
      } catch (error) {
        console.error(
          "QUIZ JSON PARSE ERROR:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "The AI returned invalid quiz JSON.",
          },
          { status: 500 }
        );
      }

      let questions: unknown =
        null;

      if (
        typeof parsed ===
          "object" &&
        parsed !== null &&
        "questions" in parsed
      ) {
        questions = (
          parsed as {
            questions: unknown;
          }
        ).questions;
      }

      if (
        !Array.isArray(
          questions
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The AI did not return quiz questions correctly.",
          },
          { status: 500 }
        );
      }

      const validQuestions: QuizQuestion[] =
        [];

      for (
        const item of questions
      ) {
        if (
          !item ||
          typeof item !==
            "object"
        ) {
          continue;
        }

        const question =
          item as Partial<QuizQuestion>;

        if (
          typeof question.question !==
            "string" ||
          !Array.isArray(
            question.options
          ) ||
          question.options.length !==
            4 ||
          !question.options.every(
            (option) =>
              typeof option ===
              "string"
          ) ||
          typeof question.answer !==
            "string" ||
          typeof question.explanation !==
            "string"
        ) {
          continue;
        }

        if (
          !question.options.includes(
            question.answer
          )
        ) {
          continue;
        }

        validQuestions.push({
          question:
            question.question,
          options:
            question.options,
          answer:
            question.answer,
          explanation:
            question.explanation,
        });
      }

      if (
        validQuestions.length !==
        5
      ) {
        console.error(
          "INVALID QUIZ STRUCTURE:",
          JSON.stringify(
            parsed,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "The AI generated an incomplete quiz. Please try again.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        questions:
          validQuestions,
      });
    }

    // =========================================================
    // NORMAL AI ASSISTANT / PLANNER
    // =========================================================

    const prompt =
      body?.prompt;

    if (
      !prompt ||
      typeof prompt !==
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a question.",
        },
        { status: 400 }
      );
    }

    const completion =
      await groq.chat.completions.create(
        {
          model:
            "openai/gpt-oss-20b",

          messages: [
            {
              role: "system",
              content: `
You are StudyOne AI, a helpful study planner and study assistant for school students.

Give simple, practical and well-organized answers.

For study plans:

- Respect the student's class.
- Respect the student's board.
- Respect the exam date.
- Respect the available study time.
- Include all provided subjects.
- Do not invent syllabus topics unless the student provides them.
- Make the plan realistic.
- Prioritize revision and practice as the exam gets closer.

Formatting rules:

- Do NOT use markdown tables.
- Never output structures like:
  | Time | Activity | Purpose |
- Use headings, bullets and short paragraphs instead.
- Keep answers easy to scan.
- Use emojis where they improve clarity.
- Do not invent facts when the student has not provided enough information.
              `.trim(),
            },

            {
              role: "user",
              content: prompt,
            },
          ],
        }
      );

    const answer =
      completion.choices[0]
        ?.message
        ?.content ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "STUDYONE AI ERROR:"
    );

    console.error(error);

    console.error(
      "================================="
    );

    let errorMessage =
      "Unknown AI service error.";

    if (
      error instanceof Error
    ) {
      errorMessage =
        error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}