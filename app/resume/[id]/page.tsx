"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, FileText } from "lucide-react";

interface Resume {
  id: string;
  name: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function ResumeView() {
  const params = useParams();
  const resumeId = params.id as string;
  const [resume, setResume] = useState<Resume | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch resume from Supabase
  useEffect(() => {
    const fetchResume = async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .single();

      if (error) {
        console.error("Error fetching resume:", error.message);
        setResume(null);
      } else {
        setResume(data);
      }
    };

    fetchResume();
  }, [resumeId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !resume) return;

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          question: question.trim(),
          resumeUrl: resume.file_url, // send file URL to backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      const aiMessage: Message = {
        role: "ai",
        content: data.answer || "Sorry, I could not process your question.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: "ai",
        content: `An error occurred while processing your question: ${
          error.message || String(error)
        }`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!resume) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 bg-white rounded-xl shadow-md text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Resume Not Found
          </h2>
          <p className="text-gray-600">
            The resume you&apos;re looking for doesn&apos;t exist.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-20 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {resume.name}&apos;s Resume
        </h1>
        <p className="text-gray-600">{resume.file_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">PDF Preview</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-[600px] flex items-center justify-center">
            <iframe
              src={resume.file_url} // use Supabase public URL
              className="w-full h-full"
              title="Resume PDF"
            />
          </div>
        </Card>

        <Card className="p-6 bg-white rounded-xl shadow-md flex flex-col h-[680px]">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chat with AI</h2>

          <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>Ask me anything about this resume!</p>
                  <p className="text-sm mt-2">
                    Try &quot;What are the key skills?&quot; or &quot;Summarize
                    this resume&quot;
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl ${
                    msg.role === "user"
                      ? "bg-gray-200 text-gray-900 ml-8"
                      : "bg-gray-900 text-white mr-8"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this resume..."
              disabled={isLoading}
              className="flex-1 border-gray-200 rounded-xl"
            />
            <Button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="bg-gray-800 hover:bg-gray-900 text-white rounded-xl px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
