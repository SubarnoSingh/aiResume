import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PDF_CO_API_KEY = process.env.PDF_CO_API_KEY || "demo"; // Use demo key if not set

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

interface OpenRouterResponse {
  choices: { message: { content: string } }[];
  error?: { message: string };
}

// Extract text from PDF using PDF.co API
async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log("Extracting PDF text using PDF.co API...");
    
    // Step 1: Request PDF text extraction
    const response = await fetch("https://api.pdf.co/v1/pdf/convert/to/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PDF_CO_API_KEY,
      },
      body: JSON.stringify({
        url: pdfUrl,
        inline: true, // Get result directly
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PDF.co API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || "PDF extraction failed");
    }

    console.log("PDF.co response:", { 
      success: data.error === false, 
      bodyLength: data.body?.length 
    });

    // The extracted text is in the 'body' field
    const text = data.body || "";
    
    if (!text || text.trim().length === 0) {
      throw new Error("PDF extraction returned empty text");
    }

    return text;
    
  } catch (error: any) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { resumeId, question } = await req.json();

    // Validation
    if (!resumeId) {
      return NextResponse.json({ error: "Missing resumeId" }, { status: 400 });
    }

    if (!question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    console.log("=== Processing Resume Chat Request ===");
    console.log("Resume ID:", resumeId);
    console.log("Question:", question);

    // 1. Fetch resume from Supabase
    const { data: resume, error: dbError } = await supabase
      .from("resumes")
      .select("file_url")
      .eq("id", resumeId)
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resumeUrl = resume.file_url;
    console.log("Resume URL:", resumeUrl);

    // 2. Extract text from PDF
    let resumeContent: string;
    try {
      resumeContent = await extractTextFromPDF(resumeUrl);
      console.log("✓ PDF text extracted successfully");
      console.log("  - Length:", resumeContent.length, "characters");
      console.log("  - First 200 chars:", resumeContent.substring(0, 200));
    } catch (pdfError: any) {
      console.error("PDF extraction failed:", pdfError);
      return NextResponse.json(
        { error: `Failed to extract text from PDF: ${pdfError.message}` },
        { status: 500 }
      );
    }

    if (!resumeContent || resumeContent.trim().length === 0) {
      return NextResponse.json(
        { error: "PDF appears to be empty or contains no extractable text" },
        { status: 500 }
      );
    }

    // 3. Validate OpenRouter API key
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "undefined") {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    console.log("✓ Sending request to OpenRouter...");

    // 4. Try multiple models with fallback
    const models = [
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "google/gemma-2-9b-it:free",
      "qwen/qwen-2-7b-instruct:free",
    ];

    let aiJson: OpenRouterResponse | null = null;
    let successfulModel = "";
    let lastError = "";

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const aiResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": req.headers.get("origin") || "http://localhost:3000",
              "X-Title": "Resume Chat Bot",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "system",
                  content:
                    "You are an AI assistant helping answer questions about a resume. Provide concise, helpful, and accurate answers based only on the provided resume text. If the information is not in the resume, clearly state that.",
                },
                {
                  role: "user",
                  content: `Resume content:\n\n${resumeContent}\n\n---\n\nQuestion: ${question}`,
                },
              ],
              temperature: 0.7,
              max_tokens: 500,
            }),
          }
        );

        const aiResponseText = await aiResponse.text();
        
        if (!aiResponse.ok) {
          lastError = aiResponseText;
          console.log(`Model ${model} failed: ${aiResponse.status}`);
          continue; // Try next model
        }

        // Try to parse response
        try {
          aiJson = JSON.parse(aiResponseText);
          
          if (aiJson.error) {
            lastError = aiJson.error.message;
            console.log(`Model ${model} returned error: ${aiJson.error.message}`);
            continue;
          }
          
          if (!aiJson.choices?.[0]?.message?.content) {
            console.log(`Model ${model} returned no content`);
            continue;
          }
          
          // Success!
          successfulModel = model;
          console.log(`✓ Model ${model} succeeded!`);
          break;
          
        } catch (parseError) {
          lastError = "Invalid JSON response";
          console.log(`Model ${model} returned invalid JSON`);
          continue;
        }
        
      } catch (fetchError: any) {
        lastError = fetchError.message;
        console.log(`Model ${model} request failed: ${fetchError.message}`);
        continue;
      }
    }

    // Check if any model succeeded
    if (!aiJson || !successfulModel) {
      console.error("All models failed. Last error:", lastError);
      return NextResponse.json(
        { 
          error: `All AI models are currently unavailable. Last error: ${lastError}. Please try again in a few moments.`,
          details: "Tried multiple models but all failed"
        },
        { status: 503 }
      );
    }

    const answer = aiJson.choices[0].message.content;
    console.log("✓ Successfully generated answer");
    console.log("  - Answer length:", answer.length, "characters");

    return NextResponse.json({ 
      answer: answer,
      metadata: {
        resumeLength: resumeContent.length,
        model: "google/gemini-flash-1.5:free",
        questionLength: question.length,
      }
    });

  } catch (err: any) {
    console.error("=== API Route Error ===");
    console.error(err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}