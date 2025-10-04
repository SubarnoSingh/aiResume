import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pdf } from "pdf-parse";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

interface OpenRouterResponse {
  choices: { message: { content: string } }[];
}

export async function POST(req: NextRequest) {
  try {
    const { resumeId, question } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resumeId" }, { status: 400 });
    }

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // 1. Fetch resume content from Supabase
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .select("file_url")
      .eq("id", resumeId)
      .single();

    if (dbError) throw dbError;

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resumeUrl = resume.file_url;

    // 2. Fetch the PDF from the URL
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch resume from ${resumeUrl}`);
    }
    const fileBuffer = await response.arrayBuffer();

    // 3. Parse the PDF
    const pdfData = await pdf(fileBuffer);
    const resumeContent = pdfData.text;
    console.log("Extracted PDF content:", resumeContent);

    // 4. Send question + resume content to OpenRouter
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant helping answer questions about a resume. Provide concise answers based *only* on the provided resume text.",
            },
            {
              role: "user",
              content: `Resume content:\n${resumeContent}\n\nQuestion: ${question}`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("OpenRouter API error:", text);
      throw new Error(`OpenRouter API error: ${text}`);
    }

    const aiJson: OpenRouterResponse =
      (await aiResponse.json()) as OpenRouterResponse;

    return NextResponse.json({ answer: aiJson.choices[0].message.content });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
