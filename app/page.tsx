import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, MessageSquare, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="px-4 md:px-20 py-8">
        <section className="text-center my-16 md:my-24">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Your Resume, Analyzed by AI
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
            Upload your resume and get instant insights. Ask questions, receive feedback, and understand your strengths with intelligent AI analysis.
          </p>
          <Link href="/resume">
            <Button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-6 text-lg rounded-xl">
              Upload Resume
            </Button>
          </Link>
        </section>

        <section className="my-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:p-8 bg-white rounded-xl shadow-md">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-gray-800" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              Upload Your Resume
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Simply upload your PDF resume and let our AI process it instantly. Secure and private.
            </p>
          </Card>

          <Card className="p-6 md:p-8 bg-white rounded-xl shadow-md">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-4 rounded-xl">
                <MessageSquare className="w-8 h-8 text-gray-800" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              Ask Questions
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Chat with AI about your resume. Ask about skills, experience, or suggestions for improvement.
            </p>
          </Card>

          <Card className="p-6 md:p-8 bg-white rounded-xl shadow-md">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 p-4 rounded-xl">
                <Sparkles className="w-8 h-8 text-gray-800" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              Instant Analysis
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              Get immediate insights and actionable feedback on your resume content and presentation.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}
