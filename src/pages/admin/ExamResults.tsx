import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Exam, Submission, AppUser } from '../../types';
import AdminLayout from '../../components/AdminLayout';
import { Download, FileText, Search, User, Calendar, Clock, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import Swal from 'sweetalert2';

export default function ExamResults() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Record<string, AppUser>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      const docSnap = await getDoc(doc(db, 'exams', examId));
      if (docSnap.exists()) {
        setExam({ id: docSnap.id, ...docSnap.data() } as Exam);
      }
    };
    loadExam();

    const q = query(collection(db, 'submissions'), where('examId', '==', examId));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const subs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
      setSubmissions(subs);
      
      // Fetch user data for these submissions
      const userIds = Array.from(new Set(subs.map(s => s.studentId)));
      if (userIds.length > 0) {
        const usersMapping: Record<string, AppUser> = { ...students };
        for (const uid of userIds) {
          if (!usersMapping[uid]) {
            const uSnap = await getDoc(doc(db, 'users', uid));
            if (uSnap.exists()) {
              usersMapping[uid] = { uid: uSnap.id, ...uSnap.data() } as AppUser;
            }
          }
        }
        setStudents(usersMapping);
      }
      setLoading(false);
    }, (error) => {
      console.error("Submissions snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [examId]);

  const exportToExcel = () => {
    if (submissions.length === 0) {
      Swal.fire('Info', 'No results to export', 'info');
      return;
    }

    const headers = ['Student Name', 'Admission No', 'Email', 'Score', 'Total Marks', 'Percentage', 'Duration (Min)', 'Submitted At'];
    const rows = submissions.map(s => {
      const student = students[s.studentId];
      const percentage = Math.round(((s.score || 0) / (s.totalMarks || 1)) * 100);
      const duration = s.endTime && s.startTime 
        ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
        : 'N/A';
        
      return [
        student?.name || 'Unknown',
        student?.admissionNumber || 'N/A',
        student?.email || 'N/A',
        s.score || 0,
        s.totalMarks,
        `${percentage}%`,
        duration,
        s.endTime ? format(new Date(s.endTime), 'yyyy-MM-dd HH:mm') : 'N/A'
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exam?.title.replace(/\s+/g, '_')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Swal.fire('Success', 'Results exported to CSV successfully', 'success');
  };

  const filteredSubmissions = submissions.filter(s => {
    const student = students[s.studentId];
    return student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <AdminLayout activeMenu="Papers" activeSubMenu="All Papers">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white text-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium tracking-tight">Exam Results: {exam?.title}</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Detailed performance breakdown for all students.</span>
        </div>
        <button 
          onClick={exportToExcel}
          className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-4 py-2 rounded text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Download className="w-3.5 h-3.5" /> Export Excel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-white p-4 rounded shadow-sm border-t-2 border-[#3c8dbc] flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search students by name or ID..."
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:border-[#3c8dbc] outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
          </div>

          <div className="bg-white rounded shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9fafb] border-b border-slate-100 uppercase font-black text-[10px] text-slate-500 tracking-widest">
                <tr>
                  <th className="px-6 py-4 lowercase first-letter:uppercase">Student Details</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Timing</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center animate-pulse text-slate-400">Loading exam results...</td></tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center italic text-slate-400">No submissions found for this exam.</td></tr>
                ) : (
                  filteredSubmissions.map((s) => {
                    const student = students[s.studentId];
                    const percentage = Math.round(((s.score || 0) / (s.totalMarks || 1)) * 100);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                 {student?.name?.[0] || <User className="w-5 h-5 opacity-40" />}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-700 leading-none mb-1">{student?.name || 'Unknown User'}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {student?.admissionNumber || 'N/A'}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center">
                              <p className="text-lg font-black text-slate-800 leading-none">{s.score}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">/ {s.totalMarks}</p>
                              <div className="w-16 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={cn(
                             "px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm",
                             percentage >= 40 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                           )}>
                              {percentage >= 40 ? 'Passed' : 'Failed'}
                           </span>
                           <p className="text-[9px] text-slate-400 font-bold mt-2 italic">{percentage}% AGG</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center gap-1.5 grayscale opacity-70">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                 <Calendar className="w-3 h-3" />
                                 {s.endTime ? format(new Date(s.endTime), 'MMM dd, HH:mm') : 'N/A'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                 <Clock className="w-3 h-3" />
                                 {s.startTime && s.endTime 
                                   ? `${Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)} MIN`
                                   : 'N/A'}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => navigate(`/result/${s.id}`)}
                              className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white p-2 rounded shadow-sm transition-all active:scale-95 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-wider"
                            >
                              <FileText className="w-3.5 h-3.5" /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
