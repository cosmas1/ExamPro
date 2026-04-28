import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase';
import { LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, firebaseUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        alert('The login popup was blocked by your browser. Please allow popups for this site and try again.');
      }
    }
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105">
              E
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">ExamCore</span>
          </Link>

          <div className="flex items-center gap-6">
            {firebaseUser ? (
              <>
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
                  <Link 
                    to="/dashboard" 
                    className={cn(
                      "transition-colors hover:text-slate-800 h-16 flex items-center",
                      location.pathname === '/dashboard' && "text-blue-600 border-b-2 border-blue-600"
                    )}
                  >
                    Dashboard
                  </Link>
                  { (user?.role === 'admin' || user?.role === 'teacher') && (
                    <Link 
                      to="/admin" 
                      className={cn(
                        "transition-colors hover:text-slate-800 h-16 flex items-center",
                        location.pathname === '/admin' && "text-blue-600 border-b-2 border-blue-600"
                      )}
                    >
                      Admin
                    </Link>
                  )}
                </div>
                <div className="h-6 w-px bg-slate-200 ml-2" />
                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || firebaseUser.displayName}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Student'}</p>
                  </div>
                  <div className="w-9 h-9 bg-slate-200 rounded-full border border-slate-300 flex items-center justify-center overflow-hidden">
                    {firebaseUser.photoURL ? (
                      <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <button 
                    onClick={() => auth.signOut()}
                    className="p-2 text-slate-400 hover:text-red-600 transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
