import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Users, LayoutGrid, HelpCircle, BookOpen, FileText,
  Bell, Settings, LogOut, ChevronRight, Share2, Globe, List, Menu,
  Search
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Exam } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { auth } from '../../firebase';
import { format } from 'date-fns';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isQuestionsMenuOpen, setIsQuestionsMenuOpen] = useState(false);
  const [isPapersMenuOpen, setIsPapersMenuOpen] = useState(false);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'exams'), where('createdBy', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Exam)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex h-screen bg-[#ecf0f5] font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#212f3d] text-white flex flex-col shrink-0 transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <div className="w-12 h-12 bg-slate-300 rounded-full border border-white/20 overflow-hidden">
            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" referrerPolicy="no-referrer" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">{user?.name || 'Admin User'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-400">Online</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">MENU</p>
          <div className="space-y-1 px-2">
            {[
              { label: 'How to Start - Easy Guide', icon: Plus },
              { label: 'Special offer for you', icon: Bell },
              { label: 'Dashboard', icon: LayoutGrid, action: () => navigate('/admin') },
              { 
                label: 'Questions', 
                icon: HelpCircle, 
                expandable: true,
                onClick: () => setIsQuestionsMenuOpen(!isQuestionsMenuOpen),
                subMenu: [
                  { label: 'All Questions', icon: Globe },
                  { label: 'Add new question', icon: Plus, action: () => navigate('/admin/questions/new') },
                  { label: 'Direct Question Add in Paper', icon: FileText },
                  { label: 'Bulk Question Upload', icon: List },
                ]
              },
              { 
                label: 'Papers', 
                icon: FileText, 
                expandable: true,
                onClick: () => setIsPapersMenuOpen(!isPapersMenuOpen),
                subMenu: [
                  { label: 'All Papers', icon: List, action: () => navigate('/admin/papers') },
                  { label: 'Add new paper', icon: Plus, action: () => navigate('/admin/papers/new') },
                  { label: 'Purchased Question upload', icon: List, action: () => navigate('/admin/papers/upload') },
                ]
              },
              { 
                label: 'Users', 
                icon: Users, 
                expandable: true,
                onClick: () => setIsUsersMenuOpen(!isUsersMenuOpen),
                subMenu: [
                  { label: 'All Users', icon: List, action: () => navigate('/admin/users') },
                  { label: 'Add new user', icon: Plus, action: () => navigate('/admin/users/new') },
                  { label: 'Bulk Upload Users', icon: List, action: () => navigate('/admin/users/bulk') },
                ]
              },
              { label: 'Sub Admins', icon: Bell, expandable: true },
              { label: 'Groups', icon: Share2, expandable: true },
              { label: 'Categories', icon: BookOpen, action: () => navigate('/admin/categories') },
              { label: 'Notifications', icon: Bell, active: true, action: () => navigate('/admin/notifications') },
              { label: 'Profile', icon: Settings },
              { label: 'Log out', icon: LogOut, action: () => auth.signOut() },
            ].map((item, i) => (
              <div key={i}>
                <button 
                  onClick={item.onClick || item.action}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded text-sm transition-colors",
                    item.active && !item.subMenu ? "bg-[#3c8dbc] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.expandable && <ChevronRight className={cn("w-3 h-3 text-slate-500 transition-transform", ((item.label === 'Questions' && isQuestionsMenuOpen) || (item.label === 'Papers' && isPapersMenuOpen) || (item.label === 'Users' && isUsersMenuOpen)) && "rotate-90")} />}
                </button>
                {item.subMenu && ((item.label === 'Questions' && isQuestionsMenuOpen) || (item.label === 'Papers' && isPapersMenuOpen) || (item.label === 'Users' && isUsersMenuOpen)) && (
                  <div className="mt-1 space-y-1 bg-black/10">
                    {item.subMenu.map((sub, si) => (
                      <button 
                        key={si}
                        onClick={sub.action}
                        className="w-full flex items-center gap-3 p-2.5 pl-10 text-xs transition-colors text-slate-400 hover:text-white"
                      >
                        <div className="w-2 h-2 rounded-full border border-current" />
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[#3c8dbc] h-12 flex items-center justify-between px-4 text-white">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:bg-white/10 p-1 rounded">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium">ExamCore Admin</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
              <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" referrerPolicy="no-referrer" />
            </div>
            <span>{user?.name || 'Admin'}</span>
          </div>
        </header>

        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-xl text-slate-700">Manage Notifications</h2>
            <span className="text-xs text-slate-400 mt-1.5 ml-2">Check Email / SMS Status</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
            <Globe className="w-3 h-3" />
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-slate-400">Notifications</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white border-t border-slate-200 rounded shadow-sm">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Notifications Manager</h3>
              <button className="text-slate-400"><div className="w-4 h-0.5 bg-slate-300" /></button>
            </div>

            <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <div className="flex items-center gap-2">
                Show 
                <select className="border border-slate-300 rounded px-1 py-0.5">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
                entries
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-3 h-3 text-slate-400" />
                Search: <input type="text" className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-400 transition-colors" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr className="uppercase font-bold tracking-tight">
                    <th className="p-3">#</th>
                    <th className="p-3">Paper Name</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3">Email Notify</th>
                    <th className="p-3">SMS Notify</th>
                    <th className="p-3">Notify Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={8} className="p-10 text-center animate-pulse text-slate-400">Loading notifications...</td></tr>
                  ) : exams.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center italic text-slate-400">No data found.</td></tr>
                  ) : (
                    exams.map((paper, i) => (
                      <tr key={paper.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-400">{i + 1}</td>
                        <td className="p-3 font-medium text-slate-700">{paper.title}</td>
                        <td className="p-3 text-slate-500">{format(new Date(paper.createdAt), 'dd/MM/yyyy')}</td>
                        <td className="p-3 text-slate-500">31/12/2026</td>
                        <td className="p-3 text-slate-500">No</td>
                        <td className="p-3 text-slate-500">No</td>
                        <td className="p-3">
                           <div className="text-[10px] space-y-0.5">
                              <p className="text-slate-500 font-medium">Email : <span className="text-slate-400 underline decoration-dotted">N/A</span></p>
                              <p className="text-slate-500 font-medium">SMS : <span className="text-slate-400 underline decoration-dotted">N/A</span></p>
                           </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                             <p className="text-red-500 font-bold tracking-tight">Paper Expired</p>
                             <button onClick={() => navigate(`/admin/exam/${paper.id}`)} className="text-[#3c8dbc] hover:underline transition-all">Edit Paper</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <p>Showing 1 to {exams.length} of {exams.length} entries</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-slate-100 rounded text-slate-400 hover:bg-slate-200 transition-colors">Previous</button>
                <button className="px-3 py-1 bg-[#3c8dbc] text-white rounded shadow-sm">1</button>
                <button className="px-3 py-1 bg-slate-100 rounded text-slate-400 hover:bg-slate-200 transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
