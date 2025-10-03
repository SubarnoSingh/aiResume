export interface Resume {
  id: string;
  name: string;
  fileName: string;
  fileData: string;
  uploadedAt: string;
}

export function getAllResumes(): Resume[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('resumes');
  return data ? JSON.parse(data) : [];
}

export function getResumeById(id: string): Resume | null {
  const resumes = getAllResumes();
  return resumes.find((r) => r.id === id) || null;
}

export function saveResume(resume: Resume): void {
  const resumes = getAllResumes();
  resumes.push(resume);
  localStorage.setItem('resumes', JSON.stringify(resumes));
}

export function deleteResume(id: string): void {
  const resumes = getAllResumes();
  const filtered = resumes.filter((r) => r.id !== id);
  localStorage.setItem('resumes', JSON.stringify(filtered));
}
