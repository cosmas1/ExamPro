import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Users, LayoutGrid, HelpCircle, BookOpen, FileText,
  Bell, Settings, LogOut, ChevronRight, Share2, Globe, List, Menu
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { auth } from '../../firebase';
import Swal from 'sweetalert2';

export default function UploadQuestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPapersMenuOpen, setIsPapersMenuOpen] = useState(true);

  const [formData, setFormData] = useState({
    paper: 'Choose Paper',
    passKey: '',
    totalQuestions: ''
  });

  const handleUpload = () => {
    if (formData.paper === 'Choose Paper' || !formData.passKey) {
      Swal.fire('Error', 'Please select a paper and enter your pass key.', 'error');
      return;
    }
    Swal.fire('Processing', 'Validating secret key and fetching questions...', 'info');
  };

  return (
    <div className="flex h-screen bg-[#ecf0f5] font-sans">
      {/* Sidebar - Consistent */}
      <aside className={cn(
        "bg-[#212f3d] text-white flex flex-col shrink-0 transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 flex items-center gap-3 border-b border-white/5">
          <div className="w-12 h-12 bg-slate-300 rounded-full border border-white/20 overflow-hidden">
            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" />
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
              { label: 'Questions', icon: HelpCircle, expandable: true, action: () => navigate('/admin/questions/new') },
              { 
                label: 'Papers', 
                icon: FileText, 
                expandable: true, 
                active: true,
                onClick: () => setIsPapersMenuOpen(!isPapersMenuOpen),
                subMenu: [
                  { label: 'All Papers', icon: List, action: () => navigate('/admin/papers') },
                  { label: 'Add new paper', icon: Plus, action: () => navigate('/admin/papers/new') },
                  { label: 'Purchased Question upload', icon: List, active: true },
                ]
              },
              { label: 'Users', icon: Users, expandable: true },
              { label: 'Sub Admins', icon: Bell, expandable: true },
              { label: 'Groups', icon: Share2, expandable: true },
              { label: 'Categories', icon: BookOpen, action: () => navigate('/admin/categories') },
              { label: 'Notifications', icon: Bell },
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
                  {item.expandable && <ChevronRight className={cn("w-3 h-3 text-slate-500 transition-transform", isPapersMenuOpen && item.label === 'Papers' && "rotate-90")} />}
                </button>
                {item.subMenu && isPapersMenuOpen && (
                  <div className="mt-1 space-y-1 bg-black/10">
                    {item.subMenu.map((sub, si) => (
                      <button 
                        key={si}
                        onClick={sub.action}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 pl-10 text-xs transition-colors",
                          sub.active ? "text-white" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full border border-current", sub.active && "bg-white border-white")} />
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden"><img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" /></div>
            <span className="text-xs">{user?.name}</span>
          </div>
        </header>

        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-xl text-slate-700">Upload Questions in Paper Through Secret Key</h2>
            <span className="text-xs text-slate-400 mt-1.5 ml-2">Secret Key - Question Upload</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
            <Globe className="w-3 h-3" />
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-slate-400">Question Upload</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white border-t border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between text-slate-700">
                <h3 className="text-sm font-medium">Question upload in Paper</h3>
                <button className="text-slate-400"><div className="w-4 h-0.5 bg-slate-300" /></button>
              </div>

              <div className="p-6 flex flex-col lg:flex-row gap-6">
                {/* Form Section */}
                <div className="lg:w-1/2 space-y-6 p-4 border border-slate-100 rounded">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Select Exam Paper</label>
                    <select 
                      value={formData.paper}
                      onChange={e => setFormData({...formData, paper: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:border-blue-500"
                    >
                      <option>Choose Paper</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Your Pass Key</label>
                    <input 
                      type="password"
                      value={formData.passKey}
                      onChange={e => setFormData({...formData, passKey: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Total Questions</label>
                    <input 
                      type="text"
                      value={formData.totalQuestions}
                      onChange={e => setFormData({...formData, totalQuestions: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-blue-500" 
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={handleUpload}
                      className="bg-[#56a7d1] hover:bg-[#4696c0] text-white px-6 py-2 rounded text-sm font-medium transition-colors shadow-sm"
                    >
                      Upload Questions
                    </button>
                  </div>
                </div>

                {/* Warning Section */}
                <div className="lg:w-1/2 bg-[#dd4b39] text-white p-6 rounded relative overflow-hidden">
                   <div className="relative z-10">
                     <p className="text-sm">If you purchased questions (paper set) from PaperShala and want to upload these questions in your exam paper then this page help you.</p>
                     <p className="mt-4 text-sm font-bold">Please note: <span className="font-normal text-xs">Question selection mode must be manual & Exam paper should be disabled before adding Questions.</span></p>
                   </div>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="bg-[#dd4b39] text-white p-6 rounded font-bold text-sm italic">
              Please Note! <span className="font-normal not-italic text-xs">This is demo version. Every detail which you add/edit will reset after every 45 mintues. Please call us at +91 89638 11371 for any query.</span>
            </div>

            <footer className="pt-8 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <p>Copyright © <span className="font-bold">PaperShala</span>. Developed by <span className="text-[#3c8dbc] font-bold">G Technologies</span>.</p>
              <p className="font-bold">Version <span className="font-normal">6.9.5</span></p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
