import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  LayoutGrid, Minus, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';
import StudentLayout from '../components/StudentLayout';
import { cn } from '../lib/utils';

const COLORS = ['#00a65a', '#dd4b39']; // Green for Correct, Red for Incorrect

export default function DetailedResult() {
  const { submissionId } = useParams();

  // Mock data representing the charts in the user's screenshots
  const donutData = [
    { name: 'Correct', value: 8 },
    { name: 'Incorrect', value: 2 },
  ];

  const timeData = [
    { name: 'Q1', time: 0.5 },
    { name: 'Q2', time: 10 },
    { name: 'Q3', time: 3 },
    { name: 'Q4', time: 2 },
    { name: 'Q5', time: 2 },
    { name: 'Q6', time: 4 },
    { name: 'Q7', time: 5 },
    { name: 'Q8', time: 4 },
    { name: 'Q9', time: 3 },
    { name: 'Q10', time: 1 },
  ];

  const overviewRows = [
    { label: 'Paper Name', value: 'Quarterly Assessment - Term 1' },
    { label: 'Paper Category', value: 'Standard Assessment (Automated)' },
    { label: 'Paper Start Date', value: '23/04/2020' },
    { label: 'Paper End Date', value: '24/04/2020' },
    { label: 'Paper Attempt Date', value: '23/04/2020' },
    { label: 'Total Questions in Paper', value: '10' },
    { label: 'Marks For Correct Answer', value: '10' },
    { label: 'Marks For InCorrect Answer', value: '0' },
  ];

  const highlightRows = [
    { label: 'Result Status', value: 'Pass', color: 'text-green-600' },
    { label: 'Your Marks / Total Marks', value: '80/100', color: 'text-slate-700' },
    { label: 'Percentage Obtained', value: '80%', color: 'text-slate-700' },
  ];

  const statTableRows = [
    { label: 'Total Questions', value: '10' },
    { label: 'Total Questions Attempt', value: '10' },
    { label: 'Total Questions Unattempt', value: '0', highlight: true },
    { label: 'Total Correct Answers', value: '8' },
    { label: 'Total InCorrect Answers', value: '2' },
  ];

  return (
    <StudentLayout activeMenu="All Results">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl text-slate-700 font-medium tracking-tight">Detailed Result</h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">Complete result with correct answers</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="font-bold text-slate-500">Home</span>
          <span className="text-slate-300 mx-1">&gt;</span>
          <span>Results</span>
          <span className="text-slate-300 mx-1">&gt;</span>
          <span>Individual Result</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {/* Overview Card */}
        <div className="bg-white rounded shadow-sm border-t-2 border-[#d2d6de]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-normal text-slate-700">Complete result overview</h3>
            <div className="flex items-center gap-2">
               <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
               <button className="text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="p-0">
             <table className="w-full text-xs text-left border-collapse">
                <tbody className="divide-y divide-slate-50">
                   {overviewRows.map((row, i) => (
                     <tr key={i}>
                        <td className="p-3 w-1/3 bg-slate-50/50 font-bold text-slate-700 border-r border-slate-100">{row.label}</td>
                        <td className="p-3 text-slate-600">{row.value}</td>
                     </tr>
                   ))}
                   {highlightRows.map((row, i) => (
                     <tr key={i} className="bg-green-50/50">
                        <td className="p-3 w-1/3 font-bold text-slate-700 border-r border-green-100/50">{row.label}</td>
                        <td className={cn("p-3 font-medium", row.color)}>{row.value}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {/* Questions Count Donut Chart */}
           <div className="bg-white rounded shadow-sm border-t-2 border-[#00a65a]">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-normal text-slate-700">Questions Count</h3>
                <div className="flex items-center gap-2">
                   <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
                   <button className="text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="p-6 h-[250px] flex flex-col items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {donutData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <RechartsTooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-900 leading-none">Correct Answer</span>
                    <span className="text-2xl font-bold text-slate-900 mt-1">8</span>
                 </div>
              </div>
           </div>

           {/* Paper Overview Stats Card */}
           <div className="bg-white rounded shadow-sm border-t-2 border-[#d2d6de]">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-normal text-slate-700">Your Paper Overview</h3>
                <div className="flex items-center gap-2">
                   <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
                   <button className="text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="p-0">
                 <table className="w-full text-xs text-left border-collapse">
                    <tbody className="divide-y divide-slate-50">
                       {statTableRows.map((row, i) => (
                         <tr key={i} className={cn(row.highlight && "bg-red-50/50")}>
                            <td className="p-3 w-3/4 font-bold text-slate-700 border-r border-slate-100">{row.label}</td>
                            <td className={cn("p-3 text-center text-slate-600", row.highlight && "text-red-700 font-bold")}>{row.value}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Time Consumed Bar Chart */}
           <div className="lg:col-span-2 bg-white rounded shadow-sm border-t-2 border-[#f39c12]">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-normal text-slate-700">Consumed time on question (Approx)</h3>
                <div className="flex items-center gap-2">
                   <button className="text-slate-300 hover:text-slate-500"><Minus className="w-3.5 h-3.5" /></button>
                   <button className="text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="p-6 h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#666' }}
                       />
                       <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#666' }} 
                        domain={[0, 10]}
                        ticks={[0, 2.5, 5, 7.5, 10]}
                       />
                       <RechartsTooltip />
                       <Bar dataKey="time" fill="#00a65a" radius={[2, 2, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>
    </StudentLayout>
  );
}
