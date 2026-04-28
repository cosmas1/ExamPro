import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, onSnapshot, serverTimestamp, setDoc, doc
} from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../../firebase';
import { UserRole } from '../../types';
import firebaseConfig from '../../../firebase-applet-config.json';
import AdminLayout from '../../components/AdminLayout';
import Swal from 'sweetalert2';

interface Session {
  id: string;
  name: string;
}

export default function AddUser() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    admissionNumber: '',
    email: '',
    password: '123123',
    sessionId: '',
    role: 'student' as UserRole
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sessions'), (snap) => {
      setSessions(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
       Swal.fire('Error', 'Please enter both first and last name', 'error');
       return;
    }

    setLoading(true);
    try {
      // Create secondary app to avoid signing out current admin
      const secondaryAppName = 'SecondaryApp';
      const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email.trim().toLowerCase(), formData.password);
      const user = userCredential.user;

      // 2. Create Firestore Document
      await setDoc(doc(db, 'users', user.uid), {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        admissionNumber: formData.admissionNumber.trim(),
        sessionId: formData.sessionId,
        createdAt: serverTimestamp(),
      });

      // 2.1 Create Lookup Document for Login with Admission Number
      if (formData.admissionNumber.trim()) {
        await setDoc(doc(db, 'admission_to_email', formData.admissionNumber.trim()), {
          email: formData.email.trim().toLowerCase(),
          uid: user.uid
        });
      }

      // 3. Sign out from secondary app to clean up
      await signOut(secondaryAuth);

      Swal.fire('Success', `${formData.role === 'admin' ? 'Admin' : formData.role === 'teacher' ? 'Teacher' : formData.role === 'staff' ? 'Staff' : 'Student'} account created. They can now login with ${formData.email} or ${formData.admissionNumber} and password ${formData.password}`, 'success');
      navigate('/admin/users');
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout activeMenu="Users" activeSubMenu="Add new user">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">Add New User</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Create student or admin accounts.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded shadow-sm border-t-2 border-[#3c8dbc]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">User Information</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">First Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Admission/ID Number</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                    value={formData.admissionNumber}
                    onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session / Group</label>
                  <select 
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:border-[#3c8dbc] outline-none"
                    value={formData.sessionId}
                    onChange={e => setFormData({ ...formData, sessionId: e.target.value })}
                  >
                    <option value="">Select Session</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Role</label>
                  <select 
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm focus:border-[#3c8dbc] outline-none"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Password (Default: 123123)</label>
                  <input 
                    type="password" 
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:border-[#3c8dbc] outline-none"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-[#00a65a] hover:bg-[#008d4c] text-white px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
