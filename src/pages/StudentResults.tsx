import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Search, ChevronLeft, ChevronRight, BarChart2, Minus
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import StudentLayout from '../components/StudentLayout';
import { cn } from '../lib/utils';

interface ExamResult {
  id: string;
  paperName: string;
  attemptDate: string;
  result: 'Pass' | 'Fail';
  marks: number;
  totalMarks: number;
  percentage: number;
}

export default function StudentResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'submissions'), 
      where('userId', '==', auth.currentUser.uid)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      // Mocking some data if collection is empty for demonstration as per user screenshots
      if (snap.empty) {
        setResults([
          { id: '1', paperName: 'Class Test by Goyal Sir', attemptDate: '23/04/2020', result: 'Pass', marks: 80, totalMarks: 100, percentage: 80 },
          { id: '2', paperName: 'Class Test by Arun Sir', attemptDate: '23/04/2020', result: 'Fail', marks: 4, totalMarks: 10, percentage: 40 },
          { id: '3', paperName: 'Internship Hire Exam', attemptDate: '23/04/2020', result: 'Pass', marks: 6, totalMarks: 10, percentage: 60 },
        ]);
        return;
      }
      
      setResults(snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          paperName: data.paperTitle || 'Unknown Exam',
          attemptDate: data.completedAt?.toDate().toLocaleDateString() || 'N/A',
          result: data.score >= (data.totalPossibleScore * 0.5) ? 'Pass' : 'Fail',
          marks: data.score || 0,
          totalMarks: data.totalPossibleScore || 0,
          percentage: Math.round(((data.score || 0) / (data.totalPossibleScore || 1)) * 100),
        };
      }) as ExamResult[]);
    }, (error) => {
      console.error("Submissions snapshot error:", error);
    });
    return () => unsub();
  }, []);

  const filteredResults = results.filter(r => 
    r.paperName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StudentLayout activeMenu="All Results">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">All Results</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">All available results included in this List.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-500">Home</span>
          <span className="text-slate-300 mx-1">&gt;</span>
          <span>All Results</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded shadow-sm border-t-2 border-[#d2d6de]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-normal text-slate-700">All Results List</h3>
              <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
            </div>
            
            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Show</span>
                  <select className="border border-slate-300 rounded px-1 py-1 bg-white outline-none">
                    <option>10</option>
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
                      <th className="p-3 border-r border-slate-200 min-w-[200px]">Paper Name</th>
                      <th className="p-3 border-r border-slate-200">Attempt Date</th>
                      <th className="p-3 border-r border-slate-200 text-center">Result</th>
                      <th className="p-3 border-r border-slate-200 text-center">Marks / Total Marks</th>
                      <th className="p-3 border-r border-slate-200 text-center">Percentage</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResults.map((result, idx) => (
                      <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-200 font-medium text-slate-700">{result.paperName}</td>
                        <td className="p-3 border-r border-slate-200 text-slate-500">{result.attemptDate}</td>
                        <td className={cn(
                          "p-3 border-r border-slate-200 text-center font-medium",
                          result.result === 'Pass' ? 'text-green-600' : 'text-red-600'
                        )}>{result.result}</td>
                        <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-bold">{result.marks}/{result.totalMarks}</td>
                        <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-bold">{result.percentage}</td>
                        <td className="p-3">
                          <button 
                            onClick={() => navigate(`/detailed-result/${result.id}`)}
                            className="bg-[#00c0ef] hover:bg-[#00acd6] text-white px-3 py-1.5 rounded flex items-center gap-1.5 font-bold transition-all active:scale-95 shadow-sm"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            DETAILED RESULT
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                <p>Showing 1 to {filteredResults.length} of {filteredResults.length} entries</p>
                <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                  <button className="px-3 py-1.5 bg-white hover:bg-slate-50 border-r border-slate-300 transition-colors font-medium">Previous</button>
                  <button className="px-3 py-1.5 bg-[#337ab7] text-white font-bold transition-colors">1</button>
                  <button className="px-3 py-1.5 bg-white hover:bg-slate-50 border-l border-slate-300 transition-colors font-medium">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
