import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import AdminLayout from '../../components/AdminLayout';
import Swal from 'sweetalert2';

interface Session {
  id: string;
  name: string;
}

export default function AddPaper() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Final Exam',
    passPercentage: 50,
    marksPerQuestion: 1,
    durationMinutes: 60,
    negativeMarks: 0,
    maxTabSwitch: 3,
    instructions: '',
    startTime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    endTime: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd HH:mm:ss"),
    sessionId: '',
    proctored: 'No',
    showResult: 'Yes',
  });

  const [dateTimes, setDateTimes] = useState({
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sessions'), (snap) => {
      setSessions(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.sessionId) {
       Swal.fire('Error', 'Please enter a title and select a session.', 'error');
       return;
    }

    try {
      const newDoc = await addDoc(collection(db, 'exams'), {
        title: formData.title,
        durationMinutes: Number(formData.durationMinutes),
        instructions: formData.instructions,
        sessionId: formData.sessionId,
        status: 'published',
        createdAt: serverTimestamp(),
        isLive: false,
        createdBy: user?.uid,
        totalQuestions: 0,
        startTime: dateTimes.startTime,
        endTime: dateTimes.endTime,
        settings: formData
      });
      Swal.fire('Success', 'Paper created! Now add your questions.', 'success');
      navigate(`/admin/exam/${newDoc.id}`);
    } catch (error) {
      Swal.fire('Error', 'Failed to save paper.', 'error');
    }
  };

  return (
    <AdminLayout activeMenu="Papers" activeSubMenu="Add new paper">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white text-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium tracking-tight">Add New Paper</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Configure exam settings and target sessions.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded shadow-sm border-t-2 border-[#3c8dbc] overflow-hidden">
             <div className="px-4 py-3 border-b border-slate-100 bg-[#f9fafb]">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Paper Details</h3>
             </div>
             
             <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paper Name / Title</label>
                      <input 
                        type="text" 
                        required
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] transition-colors outline-none"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. End of Term Science"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Academic Session</label>
                      <select 
                        required
                        className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:border-[#3c8dbc] outline-none"
                        value={formData.sessionId}
                        onChange={e => setFormData({ ...formData, sessionId: e.target.value })}
                      >
                        <option value="">Select Session (Assign to students in this group)</option>
                        {sessions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Instructions for Candidates</label>
                      <textarea 
                        rows={6}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                        value={formData.instructions}
                        onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="Enter exam rules..."
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duration (Minutes)</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                        value={formData.durationMinutes}
                        onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pass %</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                        value={formData.passPercentage}
                        onChange={e => setFormData({ ...formData, passPercentage: Number(e.target.value) })}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Proctoring</label>
                      <select 
                        className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:border-[#3c8dbc] outline-none"
                        value={formData.proctored}
                        onChange={e => setFormData({ ...formData, proctored: e.target.value })}
                      >
                        <option value="No">Disabled</option>
                        <option value="Yes">Enabled (Webcam + Fullscreen)</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tab Switch Limit</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                        value={formData.maxTabSwitch}
                        onChange={e => setFormData({ ...formData, maxTabSwitch: Number(e.target.value) })}
                      />
                   </div>
                   <div className="col-span-2 space-y-4 pt-4 border-t border-slate-100">
                      <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Start Date & Time</label>
                         <input 
                           type="datetime-local" 
                           className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none" 
                           value={dateTimes.startTime} 
                           onChange={e => setDateTimes({ ...dateTimes, startTime: e.target.value })}
                         />
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">End Date & Time</label>
                         <input 
                           type="datetime-local" 
                           className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none" 
                           value={dateTimes.endTime} 
                           onChange={e => setDateTimes({ ...dateTimes, endTime: e.target.value })}
                         />
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-[#f9fafb] p-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSubmit}
                  className="bg-[#3c8dbc] hover:bg-[#367fa9] text-white px-10 py-3 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                >
                  Create & Assign Paper
                </button>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function format(date: Date, fmt: string) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return fmt
    .replace('yyyy', date.getFullYear().toString())
    .replace('MM', pad(date.getMonth() + 1))
    .replace('dd', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
}
