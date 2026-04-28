import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Search, ChevronLeft, ChevronRight, LogIn, BarChart2, Minus, Clock
} from 'lucide-react';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Paper } from '../types';
import StudentLayout from '../components/StudentLayout';
import { cn } from '../lib/utils';

export default function StudentPaperList() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSessionId, setStudentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentSession = async () => {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setStudentSessionId(userDoc.data().sessionId || null);
      }
    };
    fetchStudentSession();
  }, []);

  useEffect(() => {
    if (studentSessionId === null) return;

    // Only show published exams for student's session
    const q = query(
      collection(db, 'exams'), 
      where('status', '==', 'published'),
      where('sessionId', '==', studentSessionId)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setPapers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Paper)));
    }, (error) => {
      console.error("Firestore error in StudentPaperList:", error);
    });
    return () => unsub();
  }, [studentSessionId]);

  const filteredPapers = papers.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StudentLayout activeMenu="All Papers">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">All Papers List</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">All papers included in this List.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-500">Home</span>
          <span className="text-slate-300 mx-1">&gt;</span>
          <span>All Papers</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded shadow-sm border-t-2 border-[#d2d6de]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-normal text-slate-700">Paper List</h3>
              <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
            </div>
            
            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Show</span>
                  <select className="border border-slate-300 rounded px-1 py-1 bg-white outline-none">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <span>entries</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Search:</span>
                  <input 
                    type="text" 
                    className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-400 transition-colors"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#f9f9f9] border-y border-slate-200">
                    <tr className="text-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-3 border-r border-slate-200 w-12 text-center">#</th>
                      <th className="p-3 border-r border-slate-200 min-w-[200px]">Name</th>
                      <th className="p-3 border-r border-slate-200">Start Date</th>
                      <th className="p-3 border-r border-slate-200">End Date</th>
                      <th className="p-3 border-r border-slate-200 text-center">Total Questions</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPapers.map((paper, idx) => (
                      <tr key={paper.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-200 font-medium text-slate-700">{paper.title}</td>
                        <td className="p-3 border-r border-slate-200 text-slate-500">08/06/2020</td>
                        <td className="p-3 border-r border-slate-200 text-slate-500">08/06/2025</td>
                        <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-bold">{paper.questionIds?.length || 0}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                             {paper.isLive ? (
                               <button 
                                 onClick={() => navigate(`/exam/${paper.id}`)}
                                 className="bg-[#00c0ef] hover:bg-[#00acd6] text-white px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-all active:scale-95 shadow-sm"
                               >
                                 <LogIn className="w-3.5 h-3.5" />
                                 ATTEMPT PAPER
                               </button>
                             ) : (
                               <button 
                                 disabled
                                 className="bg-slate-100 text-slate-400 cursor-not-allowed px-3 py-1.5 rounded flex items-center gap-1.5 font-bold border border-slate-200"
                               >
                                 <Clock className="w-3.5 h-3.5" />
                                 WAITING TO START
                               </button>
                             )}
                             <button 
                               onClick={() => navigate('/results')}
                               className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-all active:scale-95 shadow-sm"
                             >
                               <BarChart2 className="w-3.5 h-3.5" />
                               RESULT SECTION
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPapers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">No papers found matching your criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                <p>Showing 1 to {filteredPapers.length} of {filteredPapers.length} entries</p>
                <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                  <button className="px-3 py-1.5 bg-white hover:bg-slate-50 border-r border-slate-300 transition-colors">Previous</button>
                  <button className="px-3 py-1.5 bg-[#337ab7] text-white font-bold transition-colors">1</button>
                  <button className="px-3 py-1.5 bg-white hover:bg-slate-50 border-l border-slate-300 transition-colors">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
