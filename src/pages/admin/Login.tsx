import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'sonner';
import { Newspaper, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Map username to internal email
    const email = `${username}@coxbazartimes.com`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error.code);
      
      // If user doesn't exist (or invalid credential which is the generic error now)
      // and credentials match our initial setup, try to create the user
      if (
        (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') &&
        username === 'admin' &&
        password === 'Cox@2025Times'
      ) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast.success('Admin account initialized');
          navigate('/admin/dashboard');
          return;
        } catch (createErr: any) {
          console.error('Creation error:', createErr);
          if (createErr.code === 'auth/email-already-in-use') {
             toast.error('Invalid password for existing admin');
          } else {
             toast.error('Failed to initialize admin');
          }
        }
      } else {
        toast.error('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white shadow-[0_32px_64px_-12px_rgba(10,42,67,0.2)] overflow-hidden rounded-[2rem] border-2 border-white"
      >
        <div className="bg-[#0A2A43] p-10 text-center text-white relative overflow-hidden">
          <div className="inline-flex w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative z-10">
            <Newspaper className="text-[#0A2A43] w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none relative z-10">STAFF PORTAL</h1>
          <p className="text-[#1E90FF] text-[10px] font-black uppercase tracking-[0.3em] mt-2 relative z-10">Secure Gateway</p>
          <div className="absolute top-0 left-0 w-full h-full bg-[#1E90FF] opacity-[0.03] skew-x-12"></div>
        </div>

        <div className="p-10">
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-3 tracking-[0.2em]">
                Internal Username
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#1E90FF] transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-[#0A2A43] font-bold focus:outline-none focus:border-[#1E90FF] focus:bg-white transition-all shadow-inner"
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#0A2A43]/40 mb-3 tracking-[0.2em]">
                System Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#1E90FF] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#F1F5F9] border-2 border-transparent rounded-2xl py-4 pl-12 pr-12 text-[#0A2A43] focus:outline-none focus:border-[#1E90FF] focus:bg-white transition-all shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#0A2A43]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A2A43] hover:bg-[#1E90FF] text-white font-black py-5 rounded-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.25em] shadow-xl transform active:scale-95"
            >
              {loading ? 'Authenticating...' : 'Enter Newsroom'}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t-2 border-[#F1F5F9] text-center">
            <p className="text-[10px] uppercase font-black text-[#0A2A43]/20 tracking-widest">
              COX BAZAR TIMES ENGINE • V4.5.1
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
