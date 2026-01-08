export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  LOST = 'LOST'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string; // Used for QR Code
  status: BookStatus;
  category: string;
  addedDate: string;
}

export interface Student {
  id: string;
  name: string;
  studentNumber: string; // Used for QR Code
  email?: string;
  grade: string;
  readingHistory: string[]; // Array of Book IDs
}

export interface Transaction {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string; // ISO Date string
  dueDate: string;   // ISO Date string
  returnDate?: string; // ISO Date string
  isReturned: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER';
}

export interface SystemLog {
  id: string;
  type: 'ERROR' | 'INFO' | 'WARNING';
  message: string;
  timestamp: string;
  teacherId?: string;
  teacherEmail?: string;
}

export interface SupportRequest {
  id: string;
  teacherId: string;
  teacherEmail: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT';
  createdAt: string;
  authorEmail: string;
  isActive: boolean;
}