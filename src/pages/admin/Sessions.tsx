import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit3, Trash2, LayoutGrid, Minus, X, AlertCircle
} from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../components/AdminLayout';
import Swal from 'sweetalert2';

interface Session {
  id: string;
  name: string;
  description: string;
  createdAt: any;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session)));
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await addDoc(collection(db, 'sessions'), {
        name: newName.trim(),
        description: newDesc.trim(),
        createdAt: serverTimestamp(),
      });
      setNewName('');
      setNewDesc('');
      setIsAdding(false);
      Swal.fire('Created', 'Session created successfully', 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to create session', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Deleting session "${name}" will unset this session for all assigned users.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'sessions', id));
        Swal.fire('Deleted!', 'Session has been deleted.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete session', 'error');
      }
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout activeMenu="Sessions">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">Academic Sessions</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Manage student groups and class sessions.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-500">Admin</span>
          <span className="text-slate-300 mx-1">&gt;</span>
          <span>Sessions</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Add New Session Form */}
          {isAdding && (
            <div className="bg-white rounded shadow-sm border-t-2 border-[#00a65a] animate-in fade-in slide-in-from-top-4 duration-300">
               <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Add New Session</h3>
                  <button onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>
               </div>
               <form onSubmit={handleCreate} className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Name (e.g. S25)</label>
                        <input 
                          type="text" 
                          required
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-[#3c8dbc] transition-colors"
                          placeholder="Enter session name..."
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description (Optional)</label>
                        <input 
                          type="text"
                          value={newDesc}
                          onChange={e => setNewDesc(e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-[#3c8dbc] transition-colors"
                          placeholder="e.g. Science Batch 2025"
                        />
                     </div>
                  </div>
                  <div className="flex justify-end gap-2">
                     <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded transition-colors uppercase">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-[#00a65a] text-white text-xs font-bold rounded shadow-sm hover:bg-[#008d4c] transition-colors uppercase">Save Session</button>
                  </div>
               </form>
            </div>
          )}

          <div className="bg-white rounded shadow-sm border-t-2 border-[#3c8dbc]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">Sessions List</h3>
              <div className="flex items-center gap-2">
                {!isAdding && (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-[#00a65a] text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-[#008d4c] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-3 h-3" /> ADD NEW
                  </button>
                )}
                <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-6 flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search sessions..."
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded text-xs outline-none focus:border-[#3c8dbc] transition-colors"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto border rounded border-slate-100">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#f9f9f9] border-b border-slate-200">
                    <tr className="text-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-3 w-12 text-center border-r border-slate-200">#</th>
                      <th className="p-3 border-r border-slate-200">Session Name</th>
                      <th className="p-3 border-r border-slate-200">Description</th>
                      <th className="p-3 border-r border-slate-200 text-center">Created At</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.map((session, idx) => (
                      <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-200 font-bold text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{session.name}</span>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-slate-500">{session.description || 'No description'}</td>
                        <td className="p-3 border-r border-slate-200 text-center text-slate-400">
                          {session.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button 
                              onClick={() => handleDelete(session.id, session.name)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            ><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSessions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400 italic">No sessions found. Create one to start assigning students.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
