export type UserRole = 'admin' | 'teacher' | 'student';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  registrationNumber?: string;
  admissionNumber?: string;
  activeSessionId?: string;
  group?: string;
}

export type ExamStatus = 'draft' | 'published' | 'closed';

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  createdBy: string;
  createdAt: string;
  status: ExamStatus;
  sessionId?: string;
  isLive?: boolean;
  startTime?: string;
  endTime?: string;
  settings?: any;
}

export interface Paper {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions?: number;
  status: ExamStatus;
  questionIds?: string[];
  isLive?: boolean;
  startTime?: string;
  endTime?: string;
  sessionId?: string;
}

export interface Question {
  id: string;
  examId?: string;
  type?: 'mcq' | 'true_false' | 'short_answer' | 'long_answer' | string;
  language?: string;
  numOptions?: number;
  categoryId?: string;
  subCategoryId?: string;
  level?: string;
  questionText?: string;
  text?: string;
  options: string[];
  correctOption?: number;
  correctAnswer?: number | string; // index for mcq/tf, or string/serialized for others
  possibleAnswers?: string[]; // for short answers
  explanation?: string;
  order?: number;
  points?: number;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  startTime: string;
  endTime?: string;
  answers: Record<string, number | string>; // questionId -> answerIndex or text
  score?: number;
  status: 'in-progress' | 'completed';
  totalMarks: number;
}

export interface Category {
  id: string;
  name: string;
  details?: string;
  totalQuestions: number;
  status: 'Active' | 'Inactive';
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  details?: string;
  totalQuestions: number;
  status: 'Active' | 'Inactive';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
