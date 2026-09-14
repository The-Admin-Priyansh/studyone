import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // =====================================================
    // PDF NOTES
    // =====================================================

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const file = formData.get("file");
      const prompt = formData.get("prompt");

      if (!(file instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error: "Please upload a PDF file.",
          },
          { status: 400 }
        );
      }

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Only PDF files are supported.",
          },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error:
              "PDF is too large. Please upload a PDF under 10 MB.",
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const parser = new PDFParse({
        data: buffer,
      });

      const parsed = await parser.getText();

      await parser.destroy();

      const pdfText = parsed.text?.trim();

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

      const limitedText = pdfText.slice(0, 50000);

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",

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
            `.trim(),
          },
          {
            role: "user",
            content: `
${
  typeof prompt === "string"
    ? prompt
    : "Create simple, exam-focused notes from this chapter."
}

PDF CONTENT:

================ PDF START ================

${limitedText}

================ PDF END ==================

Now create the study notes.
            `.trim(),
          },
        ],
      });

      const answer =
        completion.choices[0]?.message?.content ||
        "Sorry, I couldn't generate notes from this PDF.";

      return NextResponse.json({
        success: true,
        answer,
      });
    }

    // =====================================================
    // NORMAL JSON REQUEST
    // =====================================================

    const body = await request.json();

    // =====================================================
    // QUIZ
    // =====================================================

    if (body?.mode === "quiz") {
      const className =
        typeof body.className === "string"
          ? body.className
          : "Class 10";

      const board =
        typeof body.board === "string"
          ? body.board
          : "MP Board";

      const subject =
        typeof body.subject === "string"
          ? body.subject
          : "";

      const chapter =
        typeof body.chapter === "string"
          ? body.chapter
          : "";

      const practiceMistakes =
        body.practiceMistakes === true;

      const mistakes = Array.isArray(body.mistakes)
        ? body.mistakes
        : [];

      if (!subject.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Please provide a subject.",
          },
          { status: 400 }
        );
      }

      // =====================================================
      // PREVIOUS MISTAKES
      // =====================================================

      const mistakesText = mistakes
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
          ) => `
Mistake ${index + 1}:

Question:
${mistake.question || ""}

Student's answer:
${mistake.yourAnswer || ""}

Correct answer:
${mistake.correctAnswer || ""}

Explanation:
${mistake.explanation || ""}
`
        )
        .join("\n");

      // =====================================================
      // QUIZ PROMPT
      // =====================================================

      const quizPrompt = `
Create exactly 5 multiple-choice questions for StudyOne.

Student:
Class: ${className}
Board: ${board}

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

Create NEW questions that test the same concepts the student
struggled with.

Do NOT simply copy the previous questions.

The goal is to help the student understand and improve their
weak areas.
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
- Return ONLY valid JSON.
- Do not put JSON inside markdown code fences.

Return exactly this structure:

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
`;

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",

        messages: [
          {
            role: "system",
            content:
              "You are StudyOne's strict quiz generator. Return valid JSON only.",
          },
          {
            role: "user",
            content: quizPrompt,
          },
        ],

        temperature: 0.2,

        response_format: {
          type: "json_object",
        },
      });

      const rawAnswer =
        completion.choices[0]?.message?.content?.trim();

      console.log("QUIZ RAW RESPONSE:");
      console.log(rawAnswer);

      if (!rawAnswer) {
        return NextResponse.json(
          {
            success: false,
            error: "The AI returned an empty quiz.",
          },
          { status: 500 }
        );
      }

      // =====================================================
      // PARSE JSON
      // =====================================================

      let parsed: unknown;

      try {
        parsed = JSON.parse(rawAnswer);
      } catch (parseError) {
        console.error("QUIZ JSON PARSE ERROR:");
        console.error(parseError);

        console.error("RAW AI RESPONSE:");
        console.error(rawAnswer);

        return NextResponse.json(
          {
            success: false,
            error:
              "The AI returned invalid quiz JSON.",
          },
          { status: 500 }
        );
      }

      // =====================================================
      // GET QUESTIONS
      // =====================================================

      let questions: unknown = null;

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "questions" in parsed
      ) {
        questions = (
          parsed as {
            questions: unknown;
          }
        ).questions;
      }

      if (!Array.isArray(questions)) {
        console.error(
          "QUIZ QUESTIONS ARE NOT AN ARRAY:"
        );

        console.error(parsed);

        return NextResponse.json(
          {
            success: false,
            error:
              "The AI did not return quiz questions correctly.",
          },
          { status: 500 }
        );
      }

      // =====================================================
      // VALIDATE QUESTIONS
      // =====================================================

      const validQuestions: QuizQuestion[] = [];

      for (const item of questions) {
        if (!item || typeof item !== "object") {
          continue;
        }

        const question =
          item as Partial<QuizQuestion>;

        if (
          typeof question.question !== "string" ||
          !Array.isArray(question.options) ||
          question.options.length !== 4 ||
          !question.options.every(
            (option) =>
              typeof option === "string"
          ) ||
          typeof question.answer !== "string" ||
          typeof question.explanation !== "string"
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
          question: question.question,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
        });
      }

      if (validQuestions.length !== 5) {
        console.error(
          "INVALID QUIZ STRUCTURE:"
        );

        console.error(
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
        questions: validQuestions,
      });
    }

    // =====================================================
    // NORMAL AI ASSISTANT / PLANNER
    // =====================================================

    const prompt = body?.prompt;

    if (
      !prompt ||
      typeof prompt !== "string"
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
      await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",

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
            `.trim(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const answer =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("=================================");
    console.error("STUDYONE AI ERROR:");
    console.error(error);
    console.error("=================================");

    let errorMessage =
      "Unknown AI service error.";

    if (error instanceof Error) {
      errorMessage = error.message;
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