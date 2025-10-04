// app/api/ask-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

export const runtime = "nodejs";

// TypeScript interfaces for Nanonets and OpenRouter responses
interface NanonetsResponse {
  data: {
    success: boolean;
    content: string; // JSON string of resume data
    format: string;
    file_type: string;
    pages_processed: number;
    processing_time: number;
    record_id: number;
    processing_status: string;
    multiple_outputs: boolean;
  };
}

interface OpenRouterResponse {
  choices: { message: { content: string } }[];
}

export async function POST(req: NextRequest) {
  try {
    const { resumeUrl, question } = await req.json();

    if (!resumeUrl) {
      return NextResponse.json({ error: "Missing resumeUrl" }, { status: 400 });
    }

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // 1️⃣ Fetch PDF from Supabase
    const pdfResponse = await fetch(resumeUrl);
    if (!pdfResponse.ok) throw new Error("Failed to fetch PDF");
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // 2️⃣ Send PDF to Nanonets
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    formData.append("file", blob, "resume.pdf");
    formData.append("output_type", "flat-json");

    const nnResponse = await fetch(
      "https://extraction-api.nanonets.com/extract",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DocStrange_API_KEY}`,
        },
        body: formData as any, // node-fetch FormData types workaround
      }
    );

    if (!nnResponse.ok) {
      const text = await nnResponse.text();
      throw new Error(`Nanonets API error: ${text}`);
    }

    const nnJson: any = await nnResponse.json();

    let resumeData: any = null;
    if (nnJson?.data?.content) {
      resumeData = JSON.parse(nnJson.data.content);
    } else {
      console.warn("Nanonets returned no content, returning raw response");
    }

    // 4️⃣ Send question + resume data to OpenRouter
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant helping answer questions about a resume.",
            },
            {
              role: "user",
              content: `Resume data: ${JSON.stringify(
                resumeData
              )}\n\nQuestion: ${question}`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      throw new Error(`OpenRouter API error: ${text}`);
    }

    const aiJson: OpenRouterResponse =
      (await aiResponse.json()) as OpenRouterResponse;

    return NextResponse.json({ answer: aiJson.choices[0].message.content });
  } catch (err: any) {
    console.error("Error in /api/ask-resume:", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
