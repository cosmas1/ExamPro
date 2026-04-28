import React from 'react';
import StudentLayout from '../components/StudentLayout';
import { useAuth } from '../hooks/useAuth';

export default function StudentProfile() {
  const { user } = useAuth();
  return (
    <StudentLayout activeMenu="Profile">
      <div className="bg-[#ecf0f5] px-4 py-3 border-b border-white">
        <h2 className="text-xl text-slate-700 font-medium">Profile</h2>
      </div>
      <div className="p-4">
        <div className="bg-white rounded shadow-sm p-6 max-w-2xl mx-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden mb-4 border-4 border-slate-100">
               <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" referrerPolicy="no-referrer" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{user?.name}</h3>
            <p className="text-slate-500">{user?.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registration ID</p>
              <p className="text-slate-700 font-medium">{user?.uid.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-slate-700 font-medium">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
