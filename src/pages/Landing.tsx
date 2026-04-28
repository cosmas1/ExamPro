import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, Clock, Shield, ArrowRight, User as UserIcon, Mail, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';

export default function Landing() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      Swal.showLoading();
      const user = await signInWithGoogle();
      
      // Fetch role for redirection
      let userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // Bootstrap admin if it's the target user
      if (!userDoc.exists() && user.email === 'musaukulenga1@gmail.com') {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          role: 'admin',
          createdAt: serverTimestamp()
        });
        userDoc = await getDoc(doc(db, 'users', user.uid));
      }

      const role = userDoc.data()?.role || 'student';
      
      Swal.close();
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      setIsLoggingIn(false);
      Swal.close();
      if (error.code === 'auth/popup-blocked') {
        Swal.fire('Error', 'Popup blocked. Please allow popups.', 'error');
      } else {
        Swal.fire('Error', 'Login failed.', 'error');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput || !password || isLoggingIn) return;

    setIsLoggingIn(true);
    try {
      Swal.showLoading();
      let email = userInput;

      // If not an email, assume it's an Admission Number
      if (!userInput.includes('@')) {
        const q = query(collection(db, 'users'), where('admissionNumber', '==', userInput));
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error('Invalid Admission Number or Email');
        }
        email = snap.docs[0].data().email;
      }

      await signInWithEmail(email, password);
      
      // Get role for redirect
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      const role = snap.docs[0]?.data()?.role || 'student';

      Swal.close();
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      setIsLoggingIn(false);
      Swal.fire('Login Error', error.message || 'Invalid credentials', 'error');
    }
  };

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'Reset Password',
      input: 'email',
      inputLabel: 'Enter your email address',
      inputPlaceholder: 'email@example.com',
      showCancelButton: true
    });

    if (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        Swal.fire('Success', 'Password reset email sent!', 'success');
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-tighter mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black">G</div>
              G Tech Examination Portal
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tighter">
              Secure <span className="text-blue-600">Assesment</span> Experience.
            </h1>
            <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-lg font-medium">
              Enterprise-grade proctoring, real-time analytics, and secure assessments for modern educational institutions.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
               
               <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Sign in to Account</h3>
                  <p className="text-sm text-slate-400 font-medium">Enter your credentials to access the portal</p>
               </div>
               
               <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                       Email Address or Admission Number
                     </label>
                     <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          required
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-700"
                          placeholder="Enter your ID or email..."
                          value={userInput}
                          onChange={e => setUserInput(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Password</label>
                     <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          required
                          type="password" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-700"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="flex items-center justify-between py-2 px-1">
                     <label className="flex items-center gap-2 text-[11px] text-slate-400 font-bold cursor-pointer hover:text-slate-600 transition-colors">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        Save Login Information
                     </label>
                     <button type="button" onClick={handleForgotPassword} className="text-[11px] text-blue-600 font-bold hover:underline">Reset Password?</button>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                  >
                    Enter Exam Portal <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="relative py-4">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                     <div className="relative flex justify-center text-[10px] font-black uppercase text-slate-400 bg-white px-3 tracking-widest">Single Sign-On</div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                    Sign in with Institutional Account
                  </button>
               </form>

               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-8 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Secure Access</p>
                    <p className="text-[11px] text-slate-500 font-medium">Default student password is <span className="font-bold text-blue-600 underline">123123</span>. Please change it after login.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
