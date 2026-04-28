import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AppUser as User } from '../../types';
import AdminLayout from '../../components/AdminLayout';
import { Trash2, Key, Filter, Search, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface Session {
  id: string;
  name: string;
}

export default function UserList() {
  const { user: currentUser, signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch Sessions mapping
    const fetchSessions = async () => {
      const snap = await getDocs(collection(db, 'sessions'));
      const mapping: Record<string, string> = {};
      snap.docs.forEach(doc => mapping[doc.id] = doc.data().name);
      setSessions(mapping);
    };
    fetchSessions();

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
      setLoading(false);
    }, (error) => {
      console.error("Users snapshot error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (uid: string) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete'
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, 'users', uid));
      Swal.fire('Deleted!', 'User has been removed.', 'success');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { auth } = await import('../../firebase');
      await sendPasswordResetEmail(auth, email);
      Swal.fire('Success', `Reset link sent to ${email}`, 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = async (u: User) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit User Info',
      html: `
        <div class="space-y-4 text-left p-2">
          <div>
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
            <input id="swal-name" type="text" class="w-full p-2 border rounded" value="${u.name}">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">System Role</label>
            <select id="swal-role" class="w-full p-2 border rounded">
              <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
              <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Teacher</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Session ID</label>
            <input id="swal-session" type="text" class="w-full p-2 border rounded" value="${u.sessionId || ''}" placeholder="Paste Session ID here">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-name') as HTMLInputElement).value,
          role: (document.getElementById('swal-role') as HTMLSelectElement).value,
          sessionId: (document.getElementById('swal-session') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      try {
        await updateDoc(doc(db, 'users', u.uid), {
          name: formValues.name,
          role: formValues.role,
          sessionId: formValues.sessionId
        });
        Swal.fire('Updated!', 'User records have been modified.', 'success');
      } catch (e) {
        Swal.fire('Error', 'Failed to update user.', 'error');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout activeMenu="Users" activeSubMenu="All Users">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white text-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium tracking-tight">System Users</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Manage students and administrators.</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="bg-white p-4 rounded shadow-sm border-t-2 border-[#3c8dbc] flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search by name, email or ID..."
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:border-[#3c8dbc] outline-none"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded text-sm font-medium hover:bg-slate-200 transition-colors">
              <Filter className="w-4 h-4" /> Filter Options
            </button>
          </div>

          <div className="bg-white rounded shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9fafb] border-b border-slate-100 uppercase font-black text-[10px] text-slate-500 tracking-widest">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Admission ID</th>
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center animate-pulse text-slate-400">Loading system users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center italic text-slate-400">No users match your search.</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                               {u.photoURL ? <img src={u.photoURL} alt="" /> : u.name?.[0]}
                            </div>
                            <div>
                               <p className="font-bold text-slate-700 leading-none mb-1">{u.name}</p>
                               <p className="text-[11px] text-slate-400 font-medium italic underline">{u.email}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500 font-bold tracking-tighter">
                         {u.admissionNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-tight">
                            {u.sessionId ? (sessions[u.sessionId] || 'Loading...') : 'Unassigned'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'text-red-500' : 'text-blue-500'}`}>
                            {u.role || 'Student'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(u)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded shadow-sm transition-all active:scale-95"
                            title="Edit User Info"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleResetPassword(u.email!)}
                            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded shadow-sm transition-all active:scale-95"
                            title="Reset Password"
                          >
                            <Key className="w-3 h-3" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button 
                              onClick={() => handleDelete(u.uid)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded shadow-sm transition-all active:scale-95"
                              title="Delete User"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
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
