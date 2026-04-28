import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, RefreshCw, Trophy, AlertCircle, LayoutGrid, Minus, X
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import StudentLayout from '../components/StudentLayout';
import { cn } from '../lib/utils';

const graphData = [
  { name: 'P1', percentage: 60 },
  { name: 'P2', percentage: 40 },
  { name: 'P3', percentage: 80 },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Papers Need to Attempt', value: '3', color: 'bg-[#00c0ef]', icon: CheckCircle2, link: '/papers' },
    { label: 'Exam ongoing (pending)', value: '0', color: 'bg-[#f39c12]', icon: RefreshCw, link: '/papers' },
    { label: 'Exam Paper Passed', value: '0', color: 'bg-[#00a65a]', icon: Trophy, link: '/results' },
    { label: 'Exam Paper Failed', value: '0', color: 'bg-[#dd4b39]', icon: AlertCircle, link: '/results' },
  ]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // In a real app we'd fetch actual counts
    // For now, mirroring requested look with live updates potential
    const q = query(collection(db, 'submissions'), where('userId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => d.data());
      const passed = docs.filter(d => d.score >= (d.totalPossibleScore * 0.5)).length;
      const failed = docs.filter(d => d.score < (d.totalPossibleScore * 0.5)).length;
      
      setStats(prev => [
        prev[0],
        prev[1],
        { ...prev[2], value: passed.toString() },
        { ...prev[3], value: failed.toString() },
      ]);
    }, (error) => {
      console.error("Submissions snapshot error:", error);
    });
    return () => unsub();
  }, []);

  return (
    <StudentLayout activeMenu="Dashboard">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">Dashboard</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Candidate Panel</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-500">Home</span>
          <span className="text-slate-300 mx-1">&gt;</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className={cn("rounded shadow-sm overflow-hidden flex flex-col relative", stat.color)}>
               <div className="p-4 relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-white/90 text-sm font-normal">{stat.label}</p>
               </div>
               <div className="absolute right-3 top-3 opacity-20 text-black">
                  <stat.icon className="w-16 h-16" />
               </div>
               <button 
                onClick={() => stat.link && navigate(stat.link)}
                className="w-full bg-black/10 hover:bg-black/20 text-white text-[11px] font-bold py-1.5 flex items-center justify-center gap-1.5 transition-colors uppercase tracking-tight"
               >
                  More info <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-white text-black text-[8px]">&rarr;</span>
               </button>
            </div>
          ))}
        </div>

        {/* Graph Section */}
        <div className="bg-white rounded shadow-sm border-t-2 border-[#f39c12]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-normal text-slate-700">Your Percentage Graph in All Papers</h3>
            <div className="flex items-center gap-2">
               <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
               <button className="text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#666' }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#666' }} 
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#3c8dbc" 
                    strokeWidth={2} 
                    dot={{ fill: '#3c8dbc', r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-500 font-medium">
               <span>P1 = Paper 1</span>
               <span>P2 = Paper 2</span>
               <span>P3 = Paper 3</span>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
