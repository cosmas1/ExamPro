import React from 'react';
import StudentLayout from '../components/StudentLayout';

export default function InstituteDetails() {
  return (
    <StudentLayout activeMenu="Institute Details">
      <div className="bg-[#ecf0f5] px-4 py-3 border-b border-white">
        <h2 className="text-xl text-slate-700 font-medium tracking-tighter">Institute Details</h2>
      </div>
      <div className="p-4">
        <div className="bg-white p-8 rounded shadow-sm">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center text-white font-black text-2xl">G</div>
             <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">G Tech Educational Institute</h3>
                <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">Certified Assessment Centre</p>
             </div>
          </div>
          <div className="space-y-6 text-sm text-slate-600 border-t pt-8">
             <div>
                <p className="font-bold text-slate-900 mb-1">Contact Support</p>
                <p>support@gtech-exams.com</p>
             </div>
             <div>
                <p className="font-bold text-slate-900 mb-1">Location</p>
                <p>Enterprise Plaza, Silicon Square, London,UK</p>
             </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
