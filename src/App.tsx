import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';

// Lazy load pages later or keep them simple for now
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamEditor from './pages/ExamEditor';
import AddQuestion from './pages/admin/AddQuestion';
import PaperList from './pages/admin/PaperList';
import AddPaper from './pages/admin/AddPaper';
import UploadQuestions from './pages/admin/UploadQuestions';
import Notifications from './pages/admin/Notifications';
import Sessions from './pages/admin/Sessions';
import UserList from './pages/admin/UserList';
import AddUser from './pages/admin/AddUser';
import BulkUploadUsers from './pages/admin/BulkUploadUsers';
import Categories from './pages/admin/Categories';
import BulkQuestionUpload from './pages/admin/BulkQuestionUpload';
import DirectAddQuestion from './pages/admin/DirectAddQuestion';
import StudentPaperList from './pages/StudentPaperList';
import StudentResults from './pages/StudentResults';
import StudentProfile from './pages/StudentProfile';
import InstituteDetails from './pages/InstituteDetails';
import WebcamTest from './pages/WebcamTest';
import DetailedResult from './pages/DetailedResult';
import ExamInterface from './pages/ExamInterface';
import ResultAnalysis from './pages/ResultAnalysis';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'student' }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center font-mono text-sm">LOADING_SYSTEM...</div>;
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      
      {/* Student Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/papers" element={<ProtectedRoute><StudentPaperList /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><StudentResults /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
      <Route path="/institute" element={<ProtectedRoute><InstituteDetails /></ProtectedRoute>} />
      <Route path="/webcam-test" element={<ProtectedRoute><WebcamTest /></ProtectedRoute>} />
      <Route path="/detailed-result/:submissionId" element={<ProtectedRoute><DetailedResult /></ProtectedRoute>} />
      <Route path="/exam/:examId" element={<ProtectedRoute><ExamInterface /></ProtectedRoute>} />
      <Route path="/result/:submissionId" element={<ProtectedRoute><ResultAnalysis /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/questions/new" element={<ProtectedRoute role="admin"><AddQuestion /></ProtectedRoute>} />
      <Route path="/admin/papers" element={<ProtectedRoute role="admin"><PaperList /></ProtectedRoute>} />
      <Route path="/admin/papers/new" element={<ProtectedRoute role="admin"><AddPaper /></ProtectedRoute>} />
      <Route path="/admin/papers/upload" element={<ProtectedRoute role="admin"><UploadQuestions /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><Notifications /></ProtectedRoute>} />
      <Route path="/admin/sessions" element={<ProtectedRoute role="admin"><Sessions /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><UserList /></ProtectedRoute>} />
      <Route path="/admin/users/new" element={<ProtectedRoute role="admin"><AddUser /></ProtectedRoute>} />
      <Route path="/admin/users/bulk" element={<ProtectedRoute role="admin"><BulkUploadUsers /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute role="admin"><Categories /></ProtectedRoute>} />
      <Route path="/admin/questions/bulk" element={<ProtectedRoute role="admin"><BulkQuestionUpload /></ProtectedRoute>} />
      <Route path="/admin/questions/direct" element={<ProtectedRoute role="admin"><DirectAddQuestion /></ProtectedRoute>} />
      <Route path="/admin/exam/new" element={<ProtectedRoute role="admin"><ExamEditor /></ProtectedRoute>} />
      <Route path="/admin/exam/:examId" element={<ProtectedRoute role="admin"><ExamEditor /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <main className="flex-1">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}
