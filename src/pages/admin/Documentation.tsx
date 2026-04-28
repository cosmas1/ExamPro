import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Book, CheckCircle, Users, BookOpen, FileText, BarChart, Settings } from 'lucide-react';

const docSections = [
  {
    title: '1. Initial Setup',
    icon: Settings,
    steps: [
      'Create Sessions: Go to "Sessions" to define academic years or terms.',
      'Setup Categories: Navigate to "Categories" to create subjects and their respective sub-categories (topics).',
    ]
  },
  {
    title: '2. User Management',
    icon: Users,
    steps: [
      'Add Users: You can add individual students/staff or use "Bulk Upload Users" via Excel.',
      'Sessions: Ensure students are assigned to the correct active session for exams.',
    ]
  },
  {
    title: '3. Question Bank',
    icon: BookOpen,
    steps: [
      'Add Questions: Use "Direct Add" for single questions or "Bulk Question Upload" for Excel-based imports.',
      'Manage Bank: All uploaded questions are stored in the "Question Bank" for reuse across different papers.',
    ]
  },
  {
    title: '4. Exam Creation',
    icon: FileText,
    steps: [
      'Create Paper: Go to "Exams" -> "Add Exam". Fill in basic details.',
      'Add Questions: Inside the Exam Editor, you can create new questions or import existing ones from the "Question Bank".',
      'Publish: Change the exam status to "Published" when ready for students.',
    ]
  },
  {
    title: '5. Student Portal',
    icon: CheckCircle,
    steps: [
      'Attempt Exams: Students login using their credentials or admission number.',
      'Proctoring: The system uses webcam and focus tracking to ensure exam integrity.',
    ]
  },
  {
    title: '6. Results & Analytics',
    icon: BarChart,
    steps: [
      'Detailed Analysis: View student performance breakdowns, scores, and time taken.',
      'Export: Download result reports for offline records.',
    ]
  }
];

export default function Documentation() {
  return (
    <AdminLayout activeMenu="How to Start - Easy Guide">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <Book className="w-8 h-8 text-[#3c8dbc]" />
            System Documentation & Guide
          </h1>
          <p className="text-slate-500 mt-2">Follow these steps to set up and manage your examination portal effectively.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {docSections.map((section, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <section.icon className="w-5 h-5 text-[#3c8dbc]" />
                </div>
                <h2 className="font-bold text-slate-700">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.steps.map((step, sIdx) => (
                  <li key={sIdx} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#3c8dbc] text-white p-8 rounded-3xl text-center">
          <h3 className="text-xl font-bold mb-2">Need More Help?</h3>
          <p className="text-white/80 text-sm mb-6 max-w-lg mx-auto">
            Our technical support team is available to guide you through complex setups or custom requirements.
          </p>
          <button className="px-8 py-3 bg-white text-[#3c8dbc] rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-lg">
            Contact Support
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
