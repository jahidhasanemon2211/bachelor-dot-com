/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Home,
  MapPin,
  Key,
  DoorOpen,
  Image as ImageIcon
} from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function AuthView() {
  const { signIn, createMess, joinMess } = useApp();
  
  // mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'manager' | 'member'>('manager');
  
  // manager extra
  const [messName, setMessName] = useState('');
  const [messAddress, setMessAddress] = useState('');
  
  // member extra
  const [messCode, setMessCode] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast.error('পাসওয়ার্ড মিলছে না!');
          setLoading(false);
          return;
        }

        // 1. Create User
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: fullName });
          
          // Note: Realistically, the AppContext's onAuthStateChanged will fire here and set the user.
          // But since the user might be new, they won't have a mess setup. 
          // However, we want to auto-setup their mess based on their role selection during signup!
          
          // Wait briefly for AppContext to let Firebase sync
          await new Promise(r => setTimeout(r, 1500));
          
          if (role === 'manager') {
            const tempCode = 'MESS-' + Math.floor(1000 + Math.random() * 9000);
            await createMess(messName, tempCode);
            toast.success(`মেস তৈরি হয়েছে! কোড: ${tempCode}`);
          } else {
            const result = await joinMess(messCode);
            if (result.success) toast.success(result.message);
            else toast.error(result.message);
          }

        } catch (err: any) {
             if (err.code === 'auth/operation-not-allowed') {
                toast.error('ইমেইল লগ-ইন বন্ধ আছে। দয়া করে গুগল দিয়ে সাইন-আপ করুন।');
             } else {
                toast.error(err.message || 'সাইন-আপ ব্যর্থ হয়েছে');
             }
        }
      } else {
        // Login
        try {
          await signInWithEmailAndPassword(auth, email, password);
          toast.success('সফলভাবে লগইন হয়েছে!');
        } catch (err: any) {
          toast.error('ইমেইল বা পাসওয়ার্ড ভুল!');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        {/* Banner */}
        <div className="text-center mb-6 space-y-2">
            <img 
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800" 
              alt="Bachelor dot com living space" 
              className="w-24 h-24 mx-auto rounded-3xl object-cover shadow-lg shadow-indigo-100"
            />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-2">ব্যাচেলর ডট কম</h1>
            <p className="text-xs text-slate-500 font-medium">আপনার মেস পরিচালনার সম্পূর্ণ ডিজিটাল উপায়</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          {/* Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              লগ ইন (Login)
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              সাইন আপ (Sign up)
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">পুরো নাম (Full Name)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="আপনার নাম..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">মোবাইল নম্বর (Phone)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="017123456..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 pb-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">রোল নির্বাচন করুন</label>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <div 
                        onClick={() => setRole('manager')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${role === 'manager' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}
                      >
                        <h4 className="font-bold text-sm">ম্যানেজার</h4>
                        <p className="text-[9px] mt-1 opacity-80">(নতুন মেস খুলতে)</p>
                      </div>
                      <div 
                        onClick={() => setRole('member')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${role === 'member' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}
                      >
                        <h4 className="font-bold text-sm">মেম্বার</h4>
                        <p className="text-[9px] mt-1 opacity-80">(বিদ্যমান মেসে যুক্ত হতে)</p>
                      </div>
                    </div>
                  </div>

                  {role === 'manager' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 border-dashed">
                       <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-indigo-700 uppercase">মেসের নাম</label>
                        <div className="relative">
                          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                          <input type="text" required value={messName} onChange={e => setMessName(e.target.value)} placeholder="নতুন মেসের নাম..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-indigo-100 focus:border-indigo-500 text-sm outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-indigo-700 uppercase">মেসের ঠিকানা</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                          <input type="text" value={messAddress} onChange={e => setMessAddress(e.target.value)} placeholder="ঠিকানা..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-indigo-100 focus:border-indigo-500 text-sm outline-none transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 border-dashed">
                       <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-emerald-700 uppercase">মেস কোড (Invite Code)</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                          <input type="text" required value={messCode} onChange={e => setMessCode(e.target.value)} placeholder="ম্যানেজারের দেওয়া কোড..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-100 focus:border-emerald-500 text-sm font-mono outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-emerald-700 uppercase">রুম/সিট নম্বর (ঐচ্ছিক)</label>
                        <div className="relative">
                          <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                          <input type="text" value={seatNumber} onChange={e => setSeatNumber(e.target.value)} placeholder="রুম বা সিট..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-100 focus:border-emerald-500 text-sm outline-none transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">প্রোফাইল ছবি (ঐচ্ছিক)</label>
                    <div className="relative flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="text-center text-slate-400 w-full">
                           <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                           <span className="text-[10px] font-bold block">ছবি আপলোড করতে ক্লিক করুন</span>
                        </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex justify-between">
                ইমেইল অ্যাক্সেস
                {mode === 'login' && <span className="text-indigo-500 cursor-pointer hover:underline text-[9px]">পাসওয়ার্ড ভুলে গেছেন?</span>}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gmail.com" className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="অন্তর ৬ সংখ্যার পাসওয়ার্ড..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm outline-none transition-all" />
              </div>
            </div>

            <AnimatePresence>
                {mode === 'signup' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 overflow-hidden pt-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase">কনফার্ম পাসওয়ার্ড</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="password" required={mode === 'signup'} minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="পাসওয়ার্ডটি পুনরায় লিখুন..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm outline-none transition-all" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all focus:outline-none flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
            >
               {loading ? 'প্রসেসিং...' : mode === 'login' ? 'প্রবেশ করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase">অথবা</span>
          </div>

          <button
            onClick={signIn} // Context Google sign-in
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all focus:outline-none cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            গুগল দিয়ে {mode === 'signup' ? 'সাইন আপ' : 'লগইন'} করুন (Suggest)
          </button>

        </motion.div>
      </div>
    </div>
  );
}
