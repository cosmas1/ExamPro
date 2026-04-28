import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Users, LayoutGrid, HelpCircle, BookOpen, FileText,
  Bell, Settings, LogOut, ChevronRight, Share2, Globe, List, Menu,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import Swal from 'sweetalert2';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenu?: string;
  activeSubMenu?: string;
}

export default function AdminLayout({ children, activeMenu, activeSubMenu }: AdminLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Track open states for submenus
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    Questions: activeMenu === 'Questions' || location.pathname.includes('/questions'),
    Papers: activeMenu === 'Papers' || location.pathname.includes('/papers'),
    Users: activeMenu === 'Users' || location.pathname.includes('/users'),
  });

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems = [
    { label: 'How to Start - Easy Guide', icon: Plus },
    { label: 'Special offer for you', icon: Bell },
    { label: 'Dashboard', icon: LayoutGrid, action: () => navigate('/admin'), active: location.pathname === '/admin' },
    { 
      label: 'Questions', 
      icon: HelpCircle, 
      expandable: true,
      onClick: () => toggleSubMenu('Questions'),
      isOpen: openSubMenus['Questions'],
      subMenu: [
        { label: 'All Questions', icon: Globe, action: () => navigate('/admin/questions'), active: activeSubMenu === 'All Questions' || location.pathname === '/admin/questions' },
        { label: 'Add new question', icon: Plus, action: () => navigate('/admin/questions/new'), active: activeSubMenu === 'Add new question' || location.pathname === '/admin/questions/new' },
        { label: 'Direct Question Add in Paper', icon: FileText, action: () => navigate('/admin/questions/direct') },
        { label: 'Bulk Question Upload', icon: List, action: () => navigate('/admin/questions/bulk'), active: activeSubMenu === 'Bulk Upload' || location.pathname === '/admin/questions/bulk' },
      ]
    },
    { 
      label: 'Papers', 
      icon: FileText, 
      expandable: true,
      onClick: () => toggleSubMenu('Papers'),
      isOpen: openSubMenus['Papers'],
      subMenu: [
        { label: 'All Papers', icon: List, action: () => navigate('/admin/papers'), active: location.pathname === '/admin/papers' },
        { label: 'Add new paper', icon: Plus, action: () => navigate('/admin/papers/new'), active: location.pathname === '/admin/papers/new' },
        { label: 'Purchased Question upload', icon: List, action: () => navigate('/admin/papers/upload'), active: location.pathname === '/admin/papers/upload' },
      ]
    },
    { 
      label: 'Users', 
      icon: Users, 
      expandable: true,
      onClick: () => toggleSubMenu('Users'),
      isOpen: openSubMenus['Users'],
      subMenu: [
        { label: 'All Users', icon: List, action: () => navigate('/admin/users'), active: location.pathname === '/admin/users' },
        { label: 'Add new user', icon: Plus, action: () => navigate('/admin/users/new'), active: location.pathname === '/admin/users/new' },
        { label: 'Bulk Upload Users', icon: List, action: () => navigate('/admin/users/bulk'), active: location.pathname === '/admin/users/bulk' },
      ]
    },
    { label: 'Sub Admins', icon: AlertCircle, expandable: true, action: () => Swal.fire('Info', 'Sub-admin management is an enterprise feature.', 'info') },
    { label: 'Sessions', icon: Share2, action: () => navigate('/admin/sessions'), active: location.pathname === '/admin/sessions' },
    { label: 'Categories', icon: BookOpen, action: () => navigate('/admin/categories'), active: location.pathname === '/admin/categories' },
    { label: 'Notifications', icon: Bell, action: () => navigate('/admin/notifications') },
    { label: 'Profile', icon: Settings, action: () => Swal.fire('Info', 'Admin profile editing is coming in the next update.', 'info') },
    { label: 'Log out', icon: LogOut, action: () => auth.signOut() },
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
            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" referrerPolicy="no-referrer" />
          </div>
          <div className={cn("transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0")}>
            <p className="font-bold text-xs leading-none truncate w-24">{user?.name || 'G Tech'}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-slate-300 uppercase">{user?.role || 'Staff'}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-[#4b646f] uppercase tracking-wider mb-2 py-2">MENU</p>
          <div className="space-y-0 px-0">
            {menuItems.map((item, i) => (
              <div key={i}>
                <button 
                  onClick={item.onClick || item.action}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-xs transition-colors border-l-4",
                    item.active && !item.subMenu ? "bg-[#1e282c] border-[#3c8dbc] text-white" : "border-transparent text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.expandable && <ChevronRight className={cn("w-3 h-3 text-[#b8c7ce] transition-transform", item.isOpen && "rotate-90")} />}
                </button>
                {item.subMenu && item.isOpen && (
                  <div className="bg-[#2c3b41]">
                    {item.subMenu.map((sub, si) => (
                      <button 
                        key={si}
                        onClick={sub.action}
                        className={cn(
                          "w-full flex items-center gap-3 py-2.5 pl-10 text-[11px] transition-colors",
                          sub.active ? "text-white" : "text-[#8aa4af] hover:text-white hover:bg-[#1e282c]"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full border border-current", sub.active ? "bg-white border-white" : "")} />
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

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[#3c8dbc] h-12 flex items-center justify-between px-4 text-white shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hover:bg-[#367fa9] p-1.5 rounded transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold opacity-70">ta</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 hover:bg-[#367fa9] rounded cursor-pointer transition-colors group">
                <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden border border-white/20">
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="" referrerPolicy="no-referrer" />
                </div>
                <span className="text-xs font-bold tracking-wide">{user?.name || 'G Tech'}</span>
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
