import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../components/AdminLayout';
import { AlertCircle, User, Monitor, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';

interface StudentSubmission {
  id: string;
  studentId: string;
  examId: string;
  status: string;
  email?: string;
  name?: string;
}

interface Incident {
  id: string;
  studentId: string;
  examId: string;
  type: string;
  timestamp: any;
}

export default function Monitoring() {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pinnedStudent, setPinnedStudent] = useState<StudentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qSub = query(collection(db, 'submissions'), where('status', '==', 'in-progress'));
    const unsubSub = onSnapshot(qSub, (snap) => {
        const subs = snap.docs.map(d => ({id: d.id, ...d.data()}) as StudentSubmission);
        setSubmissions(subs);
        if (!pinnedStudent && subs.length > 0) setPinnedStudent(subs[0]);
    });

    const qInc = query(collection(db, 'incidents'));
    const unsubInc = onSnapshot(qInc, (snap) => {
        setIncidents(snap.docs.map(d => ({id: d.id, ...d.data()}) as Incident));
    });

    setLoading(false);
    return () => { unsubSub(); unsubInc(); };
  }, []);

  const handleRestartExam = async (sub: StudentSubmission) => {
    const result = await Swal.fire({
        title: 'Restart Exam?',
        text: 'This will allow the student to resume the exam.',
        icon: 'warning',
        showCancelButton: true
    });
    if(result.isConfirmed) {
        await updateDoc(doc(db, 'submissions', sub.id), { status: 'in-progress' });
        // Also clear activeSession in users to fix the logout issue
        await updateDoc(doc(db, 'users', sub.studentId), { activeSessionId: null });
        Swal.fire('Updated', 'Student session reset.', 'success');
    }
  };

  const pinStudentById = (sid: string) => {
    const student = submissions.find(s => s.studentId === sid);
    if(student) setPinnedStudent(student);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Live Monitoring</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200">
             <h2 className="text-lg font-bold mb-4">Live Feed: {pinnedStudent?.name || 'No Student Selected'}</h2>
             {pinnedStudent ? (
                <iframe
                    src={`https://meet.jit.si/exam-${pinnedStudent.examId}-student-${pinnedStudent.studentId}`}
                    allow="camera; microphone; display-capture"
                    className="w-full h-96 rounded-lg border"
                />
             ) : <div className="h-96 flex items-center justify-center text-slate-400">Select a student to monitor</div>}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Monitor /> Active Candidates</h2>
                {submissions.map(sub => (
                <div key={sub.id} className={`p-3 border rounded-lg mb-2 flex justify-between items-center cursor-pointer ${pinnedStudent?.id === sub.id ? 'bg-blue-50 border-blue-200' : ''}`} onClick={() => setPinnedStudent(sub)}>
                    <span className="text-sm font-medium">{sub.name || sub.studentId}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleRestartExam(sub); }} className="text-blue-600 text-xs flex items-center gap-1"><RotateCcw size={12}/> Reset</button>
                </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertCircle /> Incidents</h2>
                {incidents.slice(0, 10).map(inc => (
                <div key={inc.id} className="text-sm p-3 border-b flex justify-between cursor-pointer hover:bg-slate-50" onClick={() => pinStudentById(inc.studentId)}>
                    <div>
                        <div className="font-bold">{inc.type.replace('_', ' ')}</div>
                        <div className="text-slate-400 text-xs">Student ID: {inc.studentId}</div>
                    </div>
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
