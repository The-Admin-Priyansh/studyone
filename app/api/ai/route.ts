import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // ==========================================
    // PDF → NOTES
    // ==========================================
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const file = formData.get("file");
      const prompt = formData.get("prompt");

      // Check file
      if (!(file instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error: "Please upload a PDF file.",
          },
          { status: 400 }
        );
      }

      // Check PDF type
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

      // Maximum file size: 10 MB
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: "PDF is too large. Please upload a PDF under 10 MB.",
          },
          { status: 400 }
        );
      }

      // Convert PDF to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // ==========================================
      // EXTRACT TEXT FROM PDF
      // ==========================================

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

      // Limit text sent to AI
      const limitedText = pdfText.slice(0, 50000);

      // ==========================================
      // SEND PDF TEXT TO GROQ
      // ==========================================

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
9. Include important dates, names and examples if present.
10. Highlight exam-important information.
11. Add important questions only from the provided content.
12. Do not use HTML.
13. Do not make the notes unnecessarily huge.
14. If something cannot be determined from the PDF, do not guess.
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

    // ==========================================
    // NORMAL JSON → AI PLANNER / ASSISTANT
    // ==========================================

    const body = await request.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a question.",
        },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
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
    console.error("StudyOne AI error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "AI service is currently unavailable.",
      },
      { status: 500 }
    );
  }
}