/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { LogOut, Plus, Users, ClipboardCopy, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function WelcomeView() {
  const { user, profile, createMess, joinMess, signOut, leaveOrDeleteMess } = useApp();
  
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection');
  const [messName, setMessName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messName.trim() || !inviteCode.trim()) {
      setErrorMsg('সবগুলো ফিল্ড পূরণ করুন।');
      return;
    }
    setProcessing(true);
    setErrorMsg('');
    try {
      await createMess(messName, inviteCode);
    } catch (err) {
      setErrorMsg('মেস তৈরি করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setProcessing(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setErrorMsg('ইনভাইট কোড লিখুন।');
      return;
    }
    setProcessing(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const result = await joinMess(inviteCode);
      if (result.success) {
        setInfoMsg(result.message);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg('অনুরোধ পাঠাতে ব্যর্থ হয়েছে।');
    } finally {
      setProcessing(false);
    }
  };

  // If user is pending manager approval
  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-slate-100 text-center relative overflow-hidden"
        >
          {/* Subtle design element */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500"
              >
                <ShieldAlert className="w-8 h-8" />
              </motion.div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 font-sans tracking-tight mb-3">
            রিকুয়েস্ট পেন্ডিং আছে
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            আপনার জয়েনিং রিকুয়েস্টটি সফলভাবে পাঠানো হয়েছে। মেস ম্যানেজার আপনার রিকুয়েস্টটি অ্যাপ্রুভ বা অনুমোদন করলে আপনি ড্যাশবোর্ড দেখতে পারবেন।
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 text-left">
            <div className="text-xs text-slate-400 mb-1">প্রেরিত তথ্য:</div>
            <div className="text-sm font-semibold text-slate-700">নাম: {profile.displayName}</div>
            <div className="text-sm font-semibold text-slate-700">ইমেইল: {profile.email}</div>
          </div>

          <div className="space-y-3">
            <button
              onClick={leaveOrDeleteMess}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-medium transition-all focus:outline-none"
            >
              রিকুয়েস্ট বাতিল করুন (Cancel Request)
            </button>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 py-2 text-sm font-medium transition-all"
            >
              <LogOut className="w-4 h-4" /> লগ আউট
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-100">
            B
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">ব্যাচেলর ডট কম</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">ম্যানেজার</span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs text-slate-500 hover:text-slate-700 font-medium transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> লগ আউট
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        {mode === 'selection' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">ব্যাচেলর ডট কম</h2>
              <p className="text-slate-500 text-sm">সহজে মেসের হিসাব, মিল এবং খরচ পরিচালনা করুন ডিজিটাল উপায়ে।</p>
            </div>

            <div className="grid gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setMode('create');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="flex items-center gap-4 p-5 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white text-left shadow-xl shadow-indigo-150 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">নতুন মেস তৈরি করুন</h3>
                  <p className="text-indigo-100 text-xs mt-0.5">আপনি মেসের ম্যানেজার হয়ে নতুন মেস ড্যাশবোর্ড তৈরি করুন।</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setMode('join');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="flex items-center gap-4 p-5 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 text-left shadow-sm transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">বিদ্যমান মেসে যোগদান করুন</h3>
                  <p className="text-slate-500 text-xs mt-0.5">আপনার ম্যানেজারের পাঠানো ইনভাইট কোড দিয়ে মেসে যুক্ত হোন।</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">নতুন মেস প্রোফাইল তৈরি</h3>
              <button 
                onClick={() => setMode('selection')}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                ফিরে যান
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">মেসের নাম:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: খিলগাঁও স্বপ্ননীড় প্লেস"
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-sm text-slate-800 font-medium outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">ইনভাইট কোড (Invite Code):</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: swapno12"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-sm text-slate-800 font-mono font-medium outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400">মেম্বারদের যুক্ত হওয়ার জন্য এই কোডটি প্রয়োজন হবে।</p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-150 transition-all focus:outline-none flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processing ? 'তৈরি হচ্ছে...' : 'মেস তৈরি করুন'}
              </button>
            </form>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">বিদ্যমান মেসে জয়েন করুন</h3>
              <button 
                onClick={() => setMode('selection')}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                ফিরে যান
              </button>
            </div>

            {infoMsg ? (
              <div className="text-center py-4 space-y-4">
                <div className="flex justify-center text-emerald-500">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <p className="text-emerald-700 text-sm font-medium leading-relaxed">
                  {infoMsg}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-slate-100 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-all"
                >
                  স্ট্যাটাস দেখুন
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">ইনভাইট কোড দিন:</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: swapno12"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-sm text-slate-800 font-mono font-medium outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400">মেস ম্যানেজার থেকে পাওয়া কোডটি দিন।</p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-slate-850 hover:bg-slate-900 text-white py-3.5 rounded-2xl text-sm font-bold shadow-md transition-all focus:outline-none flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {processing ? 'খোঁজা হচ্ছে...' : 'জয়েন রিকুয়েস্ট পাঠান'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-slate-400 py-4 max-w-sm mx-auto">
        ব্যাচেলর ডট কম © ২০২৬ । ঝটপট calculations, একদম সঠিক মেস হিসাব।
      </div>
    </div>
  );
}
