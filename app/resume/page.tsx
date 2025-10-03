'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export default function UploadResume() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a valid PDF file');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !file) {
      alert('Please provide your name and upload a PDF');
      return;
    }

    setIsSubmitting(true);

    const reader = new FileReader();
    reader.onload = () => {
      const resumeId = Date.now().toString();
      const resumeData = {
        id: resumeId,
        name: name.trim(),
        fileName: file.name,
        fileData: reader.result,
        uploadedAt: new Date().toISOString(),
      };

      const existingResumes = JSON.parse(localStorage.getItem('resumes') || '[]');
      existingResumes.push(resumeData);
      localStorage.setItem('resumes', JSON.stringify(existingResumes));

      router.push(`/resume/${resumeId}`);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen px-4 md:px-20 py-8">
      <div className="max-w-2xl mx-auto my-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
          Upload Your Resume
        </h1>
        <p className="text-gray-600 text-center mb-8 leading-relaxed">
          Share your resume and start chatting with AI for personalized insights
        </p>

        <Card className="p-6 md:p-8 bg-white rounded-xl shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-900 font-medium mb-2 block">
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="border-gray-200 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="resume" className="text-gray-900 font-medium mb-2 block">
                Resume (PDF only)
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                  className="hidden"
                />
                <Label
                  htmlFor="resume"
                  className="cursor-pointer text-gray-600 hover:text-gray-900"
                >
                  {file ? (
                    <span className="text-gray-900 font-medium">{file.name}</span>
                  ) : (
                    <>
                      <span className="text-gray-800 font-medium">Click to upload</span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </>
                  )}
                </Label>
                <p className="text-sm text-gray-500 mt-2">PDF files only</p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-6 rounded-xl text-base font-medium"
            >
              {isSubmitting ? 'Processing...' : 'Continue'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
