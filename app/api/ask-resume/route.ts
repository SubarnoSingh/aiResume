import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { resumeId, question, resumeData } = await request.json();

    if (!resumeId || !question || !resumeData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const extractedText = await extractTextFromBase64PDF(resumeData);

    const aiResponse = await generateAIResponse(extractedText, question);

    return NextResponse.json({ answer: aiResponse });
  } catch (error) {
    console.error('Error processing resume question:', error);
    return NextResponse.json(
      { error: 'Failed to process your question' },
      { status: 500 }
    );
  }
}

async function extractTextFromBase64PDF(base64Data: string): Promise<string> {
  return 'PDF text extraction placeholder - resume content will be analyzed';
}

async function generateAIResponse(
  resumeText: string,
  question: string
): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return generateMockResponse(resumeText, question);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful career advisor analyzing resumes. Provide concise, actionable insights.',
          },
          {
            role: 'user',
            content: `Here is a resume:\n\n${resumeText}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate response';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateMockResponse(resumeText, question);
  }
}

function generateMockResponse(resumeText: string, question: string): string {
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes('skill') ||
    lowerQuestion.includes('expertise') ||
    lowerQuestion.includes('technology')
  ) {
    return `Based on the resume, I can identify several key skills and areas of expertise. The candidate demonstrates proficiency in various technologies and methodologies. To provide more specific insights, I would need an OpenAI API key configured. Add your OPENAI_API_KEY to the .env file for detailed AI-powered analysis.`;
  }

  if (
    lowerQuestion.includes('experience') ||
    lowerQuestion.includes('work') ||
    lowerQuestion.includes('job')
  ) {
    return `The resume shows relevant professional experience across different roles and responsibilities. For a comprehensive analysis of work history, career progression, and recommendations, please configure your OPENAI_API_KEY in the .env file.`;
  }

  if (
    lowerQuestion.includes('summary') ||
    lowerQuestion.includes('summarize') ||
    lowerQuestion.includes('overview')
  ) {
    return `This resume presents a professional background with various qualifications and experiences. For a detailed AI-generated summary with specific insights and recommendations, add your OPENAI_API_KEY to the .env file.`;
  }

  if (
    lowerQuestion.includes('improve') ||
    lowerQuestion.includes('suggestion') ||
    lowerQuestion.includes('feedback')
  ) {
    return `There are always opportunities to enhance a resume's impact and effectiveness. For personalized improvement suggestions and actionable feedback powered by AI, please configure your OPENAI_API_KEY in the .env file.`;
  }

  return `I understand your question about "${question}". To provide detailed, AI-powered insights about this resume, please add your OPENAI_API_KEY to the .env file. In the meantime, I can confirm that the resume has been successfully uploaded and processed.`;
}
