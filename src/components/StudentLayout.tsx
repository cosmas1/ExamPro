import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, FileText, BarChart2, User, Landmark, Camera, LogOut, Menu, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

interface StudentLayoutProps {
  children: React.ReactNode;
  activeMenu?: string;
}

export default function StudentLayout({ children, activeMenu }: StudentLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { label: 'Dashboard', icon: LayoutGrid, action: () => navigate('/dashboard'), active: location.pathname === '/dashboard' || activeMenu === 'Dashboard' },
    { label: 'All Papers', icon: FileText, action: () => navigate('/papers'), active: location.pathname === '/papers' || activeMenu === 'All Papers' },
    { label: 'All Results', icon: BarChart2, action: () => navigate('/results'), active: location.pathname.startsWith('/results') || location.pathname.startsWith('/detailed-result') || activeMenu === 'All Results' },
    { label: 'Profile', icon: User, action: () => navigate('/profile'), active: location.pathname === '/profile' || activeMenu === 'Profile' },
    { label: 'Institute Details', icon: Landmark, action: () => navigate('/institute'), active: location.pathname === '/institute' || activeMenu === 'Institute Details' },
    { label: 'Webcam Test', icon: Camera, action: () => navigate('/webcam-test'), active: location.pathname === '/webcam-test' || activeMenu === 'Webcam Test' },
    { label: 'Log out', icon: LogOut, action: () => auth.signOut(), active: false },
  ];

  return (
    <div className="flex h-screen bg-[#ecf0f5] font-sans">
      <aside className={cn(
        "bg-[#222d32] text-white flex flex-col shrink-0 transition-all duration-300",
        isSidebarOpen ? "w-56" : "w-0 overflow-hidden"
      )}>
        {/* Sidebar Brand Header */}
        <div className="h-12 bg-[#367fa9] flex items-center justify-center shrink-0">
          <span className="font-bold text-lg tracking-tight">G Tech</span>
        </div>

        {/* User Profile */}
        <div className="p-4 flex items-center gap-3 bg-[#222d32] shrink-0 border-b border-black/10">
          <div className="w-10 h-10 bg-slate-300 rounded-full border border-white/20 overflow-hidden">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
              alt="" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className={cn("transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0")}>
            <p className="font-bold text-xs leading-none truncate w-24">{user?.name || 'Student1'}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-300 uppercase">Online</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-[#4b646f] uppercase tracking-wider mb-2 py-2">MENU</p>
          <div className="space-y-0 px-0">
            {menuItems.map((item, i) => (
              <button 
                key={i}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-xs transition-colors border-l-4",
                  item.active ? "bg-[#1e282c] border-[#3c8dbc] text-white" : "border-transparent text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-3.5 h-3.5", item.active ? "text-white" : "text-[#b8c7ce]")} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[#3c8dbc] h-12 flex items-center justify-between px-4 text-white shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:bg-[#367fa9] p-1.5 rounded transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 font-medium">
             <div className="flex items-center gap-2 px-3 py-1 hover:bg-[#367fa9] rounded cursor-pointer transition-colors">
                <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden border border-white/20">
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" referrerPolicy="no-referrer" />
                </div>
                <span className="text-xs font-bold tracking-wide">{user?.name || 'Student1'}</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
