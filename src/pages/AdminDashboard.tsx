import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Exam, AppUser as User, Submission } from '../types';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, Users, LayoutGrid, BarChart3, 
  HelpCircle, BookOpen, AlertCircle, FileText,
  Search, Bell, Settings, LogOut, ChevronRight,
  MoreVertical, CheckSquare, Book, Share2, Edit2, Trash2,
  Menu as MenuIcon, Globe, List as ListIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [submissionsCount, setSubmissionsCount] = useState({ total: 0, pass: 0, fail: 0 });
  const [counts, setCounts] = useState({ users: 0, questions: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Fetch Exams
    const examsQuery = query(collection(db, 'exams'), where('createdBy', '==', user.uid));
    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examsData);
    }, (error) => {
      console.error("Exams snapshot error:", error);
    });

    // Fetch counts and other data
    const fetchData = async () => {
      try {
        // Total Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;

        // Recent Users (Top 10)
        const recentUsersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10));
        const recentSnap = await getDocs(recentUsersQuery);
        setRecentUsers(recentSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as User)));

        // Total Sessions
        const sessionsSnap = await getDocs(collection(db, 'sessions'));
        const totalSessions = sessionsSnap.size;

        // Total Questions
        const questionsSnap = await getDocs(collection(db, 'questions'));
        const totalQuestions = questionsSnap.size;

        setCounts({
          users: totalUsers,
          sessions: totalSessions,
          questions: totalQuestions
        });

        // Submissions
        const submissionsQuery = query(collection(db, 'submissions'));
        const subSnap = await getDocs(submissionsQuery);
        const subs = subSnap.docs.map(doc => doc.data() as Submission);
        const total = subs.length;
        const pass = subs.filter(s => (s.score || 0) >= (s.totalMarks * 0.5)).length;
        setSubmissionsCount({ total, pass, fail: total - pass });

        setLoading(false);
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setLoading(false);
      }
    };

    fetchData();

    return () => unsubscribeExams();
  }, [user]);

  const stats = [
    { title: 'Total papers on server', value: exams.length, icon: CheckSquare, color: 'bg-[#00c0ef]', sub: 'More info', link: '/admin/papers' },
    { title: 'Total questions on server', value: counts.questions, icon: Book, color: 'bg-[#f39c12]', sub: 'More info', link: '/admin/questions/bulk' },
    { title: 'Total Users', value: counts.users, icon: Users, color: 'bg-[#00a65a]', sub: 'More info', link: '/admin/users' }, 
    { title: 'Total sessions', value: counts.sessions, icon: Share2, color: 'bg-[#dd4b39]', sub: 'More info', link: '/admin/sessions' },
  ];

  const chartData = [
    { name: 'Pass', value: submissionsCount.pass, color: '#00a65a' },
    { name: 'Fail', value: submissionsCount.fail, color: '#f56954' },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#ecf0f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout activeMenu="Dashboard">
      <div className="bg-[#ecf0f5] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm border-b border-white text-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-medium tracking-tight">
            {user?.role === 'teacher' ? 'Teacher Dashboard' : 'System Dashboard'}
          </h2>
          <span className="text-[11px] text-slate-400 mt-2 font-normal">
            {user?.role === 'teacher' ? 'Your academic overview and exam controls.' : 'Real-time statistics and system overview.'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className={cn("relative rounded overflow-hidden text-white shadow-sm", stat.color)}>
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                    <p className="text-xs opacity-90 mt-1">{stat.title}</p>
                  </div>
                  <stat.icon className="w-12 h-12 opacity-20" />
                </div>
                <button 
                  onClick={() => navigate(stat.link)}
                  className="w-full bg-black/10 py-1.5 text-[10px] font-medium flex items-center justify-center gap-1 hover:bg-black/20 transition-colors"
                >
                  {stat.sub} <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Overall Result Donut */}
            <div className="bg-white border-t-2 border-[#00c0ef] rounded shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Overall Result Analytics</h3>
                <LayoutGrid className="w-3 h-3 text-slate-300" />
              </div>
              <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                <div className="relative w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={450}
                        endAngle={90}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average</p>
                    <p className="text-3xl font-black text-slate-800">
                      {submissionsCount.total > 0 ? Math.round((submissionsCount.pass / submissionsCount.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Summary Table */}
            <div className="bg-white border-t-2 border-[#00a65a] rounded shadow-sm flex flex-col">
              <div className="p-3 border-b border-slate-100">
                <h3 className="text-sm font-medium text-slate-700">Examination Summary</h3>
              </div>
              <div className="p-0 flex-1">
                <table className="w-full text-sm text-left">
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-600">Total Attempts Recorded</td>
                      <td className="p-4 text-right font-black text-slate-800">{submissionsCount.total}</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-600">Passed Candidates</td>
                      <td className="p-4 text-right font-black text-green-600 underline">
                         {submissionsCount.pass}
                         <span className="text-[10px] text-slate-400 ml-2 italic">({submissionsCount.total > 0 ? Math.round((submissionsCount.pass / submissionsCount.total) * 100) : 0}%)</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-600">Failed Candidates</td>
                      <td className="p-4 text-right font-black text-red-500">
                         {submissionsCount.fail}
                         <span className="text-[10px] text-slate-400 ml-2 italic">({submissionsCount.total > 0 ? Math.round((submissionsCount.fail / submissionsCount.total) * 100) : 0}%)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Last Registered Users */}
          <div className="bg-white border-t-2 border-[#3c8dbc] rounded shadow-sm">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Recent User Activations</h3>
              <ListIcon className="w-4 h-4 text-slate-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-[#f9fafb] text-slate-500 border-b border-slate-100 uppercase font-black tracking-widest text-[9px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Full Identity</th>
                    <th className="p-3 text-center">Admission ID</th>
                    <th className="p-3">Institutional Email</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 italic">No recent registrations found on this node.</td>
                    </tr>
                  ) : (
                    recentUsers.map((u, i) => (
                      <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-300 font-mono">{(i + 1).toString().padStart(2, '0')}</td>
                        <td className="p-4 font-bold text-slate-700 mb-0.5">{u.name || 'ANONYMOUS'}</td>
                        <td className="p-4 text-center text-slate-500 font-mono italic tracking-tighter">
                           {u.admissionNumber || 'UNASSIGNED'}
                        </td>
                        <td className="p-4">
                           <span className="text-blue-500 font-medium lowercase italic underline decoration-blue-200">{u.email}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded uppercase tracking-tighter shadow-sm">Activated</span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-1.5 text-white">
                            <button className="p-1.5 bg-[#00c0ef] rounded hover:opacity-80 transition-opacity" title="Quick View"><Search className="w-3 h-3" /></button>
                            <button className="p-1.5 bg-[#f39c12] rounded hover:opacity-80 transition-opacity" title="Edit Profile"><Edit2 className="w-3 h-3" /></button>
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
      </div>
    </AdminLayout>
  );
}

// End of file

