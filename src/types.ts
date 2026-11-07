export type Role = 'admin' | 'student';

export interface Student {
  id: string;
  name: string;
  canTakeExam: boolean;
  classId: string;
}

export interface Question {
  id: string;
  category: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  score: number;
  total: number;
  date: string; // ISO timestamp when the exam was submitted (end time)
  startTime: string; // ISO timestamp when the exam was started
  answers: Record<string, number>; // questionId -> selectedOptionIndex
}

export interface ClassGroup {
  id: string;
  name: string;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
}