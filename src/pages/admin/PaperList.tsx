import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, onSnapshot, deleteDoc, doc, updateDoc, getDocs, addDoc, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Exam } from '../../types';
import AdminLayout from '../../components/AdminLayout';
import { Edit2, Trash2, Play, Pause, Search, BarChart3, Clock, Copy, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import Swal from 'sweetalert2';
import { useAuth } from '../../hooks/useAuth';

export default function PaperList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditSession = async (exam: Exam) => {
    const sessionOptions = Object.entries(sessions).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
    const { value: sessionId } = await Swal.fire({
      title: 'Assign to Session',
      input: 'select',
      inputOptions: { ...sessions, 'global': 'Global' },
      inputValue: exam.sessionId || 'global',
      showCancelButton: true
    });
    if (sessionId) {
      await updateDoc(doc(db, 'exams', exam.id), { sessionId: sessionId === 'global' ? null : sessionId });
      Swal.fire('Updated', 'Paper session updated', 'success');
    }
  };

  const handleDuplicate = async (exam: Exam) => {
    const { value: formValues } = await Swal.fire({
      title: 'Duplicate Paper',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="New Title" value="${exam.title} (Copy)">
      `,
      preConfirm: () => {
         return (document.getElementById('swal-title') as HTMLInputElement).value;
      }
    });

    if (formValues) {
        const batch = writeBatch(db);
        const newExamRef = doc(collection(db, 'exams'));
        const { id, ...examData } = exam;
        batch.set(newExamRef, { ...examData, title: formValues, createdAt: serverTimestamp() });
        
        const questionsSnap = await getDocs(collection(db, 'exams', exam.id, 'questions'));
        questionsSnap.docs.forEach(qDoc => {
            const newQRef = doc(collection(newExamRef, 'questions'));
            batch.set(newQRef, qDoc.data());
        });
        
        await batch.commit();
        Swal.fire('Duplicated', 'Paper duplicated successfully', 'success');
    }
  };

  const handleEditTime = async (exam: Exam) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Exam Details',
      html: `
        <div class="space-y-4 text-left p-2">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Duration (Min)</label>
            <input id="swal-duration" type="number" class="w-full p-2 border rounded" value="${exam.durationMinutes}">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Start Time</label>
            <input id="swal-start" type="datetime-local" class="w-full p-2 border rounded" value="${exam.startTime || ''}">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">End Time</label>
            <input id="swal-end" type="datetime-local" class="w-full p-2 border rounded" value="${exam.endTime || ''}">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          durationMinutes: (document.getElementById('swal-duration') as HTMLInputElement).value,
          startTime: (document.getElementById('swal-start') as HTMLInputElement).value,
          endTime: (document.getElementById('swal-end') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      try {
        await updateDoc(doc(db, 'exams', exam.id), {
          durationMinutes: Number(formValues.durationMinutes),
          startTime: formValues.startTime,
          endTime: formValues.endTime
        });
        Swal.fire('Updated!', 'Exam timing has been updated.', 'success');
      } catch (e) {
        Swal.fire('Error', 'Failed to update timing.', 'error');
      }
    }
  };

  const safeFormatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      // If Firestore Timestamp
      if (date.toDate) return format(date.toDate(), 'MMM dd, yyyy');
      // If ISO string or number
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Paper?',
      text: "This will permanently remove the exam.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete'
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'exams', id));
      Swal.fire('Deleted!', 'Exam removed successfully.', 'success');
    }
  };

  const toggleStatus = async (exam: Exam) => {
    const newStatus = exam.status === 'published' ? 'closed' : 'published';
    await updateDoc(doc(db, 'exams', exam.id), { status: newStatus });
  };

  const toggleLive = async (exam: Exam) => {
    await updateDoc(doc(db, 'exams', exam.id), { isLive: !exam.isLive });
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Exam is now ${!exam.isLive ? 'LIVE' : 'WAITING'}`,
      showConfirmButton: false,
      timer: 2000
    });
  };

  const filteredExams = exams.filter(e => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout activeMenu="Papers" activeSubMenu="All Papers">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white text-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium tracking-tight">Active Papers</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Manage examinations and assignments.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-white p-4 rounded shadow-sm border-t-2 border-[#3c8dbc] flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search papers by title..."
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:border-[#3c8dbc] outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <button 
              onClick={() => navigate('/admin/papers/new')}
              className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              Add New Paper
            </button>
          </div>

          <div className="bg-white rounded shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9fafb] border-b border-slate-100 uppercase font-black text-[10px] text-slate-500 tracking-widest">
                <tr>
                  <th className="px-6 py-4">Exam Info</th>
                  <th className="px-6 py-4">Assigned Session</th>
                  <th className="px-6 py-4 text-center">Schedule</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center animate-pulse text-slate-400">Loading exams...</td></tr>
                ) : filteredExams.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center italic text-slate-400">No papers found.</td></tr>
                ) : (
                  filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <div>
                            <p className="font-bold text-slate-700 leading-none mb-1">{exam.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                               Created: {safeFormatDate(exam.createdAt)}
                            </p>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-tight shadow-sm border border-slate-200">
                            {exam.sessionId ? (sessions[exam.sessionId] || 'Loading...') : 'Global'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{exam.durationMinutes} MIN</span>
                            <div className="text-[9px] text-slate-400 font-medium">
                               <p>Start: {exam.startTime || 'TBD'}</p>
                               <p>End: {exam.endTime || 'TBD'}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              "px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm",
                              exam.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            )}>
                                {exam.status === 'published' ? 'Active' : 'Closed'}
                            </span>
                            {exam.status === 'published' && (
                               <span className={cn(
                                 "text-[8px] font-bold",
                                 exam.isLive ? 'text-green-500 animate-pulse' : 'text-slate-400 italic'
                               )}>
                                  {exam.isLive ? '● LIVE NOW' : 'Waiting for Start'}
                               </span>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                             onClick={() => handleDuplicate(exam)}
                             className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded shadow-sm transition-all active:scale-95"
                             title="Duplicate Paper"
                           >
                             <Copy className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => handleEditSession(exam)}
                             className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded shadow-sm transition-all active:scale-95"
                             title="Edit Session"
                           >
                             <Settings className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => handleEditTime(exam)}
                             className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded shadow-sm transition-all active:scale-95"
                             title="Edit Exam Timing"
                           >
                             <Clock className="w-3 h-3" />
                           </button>
                          {exam.status === 'published' && (
                             <button 
                               onClick={() => toggleLive(exam)}
                               className={cn(
                                 "text-white p-2 rounded shadow-sm transition-all active:scale-95",
                                 exam.isLive ? 'bg-red-500' : 'bg-green-600'
                               )}
                               title={exam.isLive ? 'Stop Exam Session' : 'Start Exam Session Now'}
                             >
                               <Play className={cn("w-3 h-3", exam.isLive && "fill-current")} />
                             </button>
                          )}
                          <button 
                            onClick={() => navigate(`/admin/papers/results/${exam.id}`)}
                            className="bg-[#605ca8] hover:bg-[#555299] text-white p-2 rounded shadow-sm transition-all active:scale-95"
                            title="View Results"
                          >
                            <BarChart3 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/exam/${exam.id}`)}
                            className="bg-[#00c0ef] hover:bg-[#00acd6] text-white p-2 rounded shadow-sm transition-all active:scale-95"
                            title="Edit Questions"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => toggleStatus(exam)}
                            className={cn(
                              "text-white p-2 rounded shadow-sm transition-all active:scale-95",
                              exam.status === 'published' ? 'bg-[#f39c12]' : 'bg-[#00a65a]'
                            )}
                            title={exam.status === 'published' ? 'Close Exam' : 'Publish Exam'}
                          >
                            {exam.status === 'published' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </button>
                          <button 
                            onClick={() => handleDelete(exam.id)}
                            className="bg-[#dd4b39] hover:bg-[#c23321] text-white p-2 rounded shadow-sm transition-all active:scale-95"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
