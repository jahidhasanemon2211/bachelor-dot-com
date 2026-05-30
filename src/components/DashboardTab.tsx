/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  Utensils, 
  TrendingUp, 
  Wallet, 
  UserCheck, 
  UserMinus, 
  Users, 
  Search, 
  Info,
  Calendar,
  Sparkles,
  ClipboardCopy
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DashboardTab() {
  const { 
    profile, 
    mess, 
    members, 
    meals, 
    expenses, 
    deposits, 
    schedules,
    routines,
    approveMember, 
    removeMember,
    changeMemberRole
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Copy Mess Invite Code
  const copyInvite = () => {
    if (mess?.inviteCode) {
      navigator.clipboard.writeText(mess.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- Real-time Financial Calculations ---
  
  // 1. Total Meals in the Mess
  const totalMessMeals = useMemo(() => {
    return meals.reduce((sum, record) => sum + (record.breakfast || 0) + (record.lunch || 0) + (record.dinner || 0), 0);
  }, [meals]);

  // 2. Total Marketing Expenses
  const totalMessExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [expenses]);

  // 3. Current Meal Rate (Total Expense / Total Meals)
  const mealRate = useMemo(() => {
    return totalMessMeals > 0 ? Number((totalMessExpenses / totalMessMeals).toFixed(2)) : 0;
  }, [totalMessExpenses, totalMessMeals]);

  // 4. Total Approved Deposits
  const totalMessDeposits = useMemo(() => {
    return deposits
      .filter(dep => dep.status === 'approved')
      .reduce((sum, dep) => sum + (dep.amount || 0), 0);
  }, [deposits]);

  // 5. Cash In Hand (Total Deposits - Total Expenses)
  const cashInHand = useMemo(() => {
    return totalMessDeposits - totalMessExpenses;
  }, [totalMessDeposits, totalMessExpenses]);

  // --- Individual Member Calculations (Ledger) ---
  const memberLedgerList = useMemo(() => {
    return members.map(m => {
      // Calculate member meals
      const individualMeals = meals
        .filter(r => r.userId === m.uid)
        .reduce((sum, record) => sum + (record.breakfast || 0) + (record.lunch || 0) + (record.dinner || 0), 0);

      // Calculate member approved deposits
      const individualDeposits = deposits
        .filter(d => d.userId === m.uid && d.status === 'approved')
        .reduce((sum, dep) => sum + (dep.amount || 0), 0);

      const individualCost = Number((individualMeals * mealRate).toFixed(2));
      const balance = Number((individualDeposits - individualCost).toFixed(2));

      return {
        ...m,
        totalMeals: individualMeals,
        totalDeposits: individualDeposits,
        totalCost: individualCost,
        balance
      };
    });
  }, [members, meals, deposits, mealRate]);

  // Filter Active vs Pending Members
  const activeMembersData = useMemo(() => {
    return memberLedgerList.filter(m => m.status === 'active');
  }, [memberLedgerList]);

  const pendingMembersData = useMemo(() => {
    return memberLedgerList.filter(m => m.status === 'pending');
  }, [memberLedgerList]);

  // Search filter
  const filteredActiveMembers = useMemo(() => {
    return activeMembersData.filter(m => 
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeMembersData, searchQuery]);

  // --- Chart Data Formatting ---
  // Line chart aggregating expenses of last 7 entries
  const chartData = useMemo(() => {
    const rawData = [...expenses].reverse().slice(-7);
    return rawData.map(e => ({
      date: e.date,
      amount: e.amount,
    }));
  }, [expenses]);

  // Tomorrow's Shopper & Today's Menu compute
  const tomorrowShopperName = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tmrw = d.toISOString().split('T')[0];
    const sch = schedules.find(s => s.date === tmrw);
    return sch ? sch.userName : 'নির্ধারণ করা হয়নি';
  }, [schedules]);

  const todayMenu = useMemo(() => {
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const curDay = days[d.getDay()];
    return routines.find(r => r.dayOfWeek === curDay);
  }, [routines]);

  return (
    <div className="space-y-6 pb-20 font-sans">
      
      {/* Welcome & Invitation Code Bar */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Abstract vector rings */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-lg" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider bg-white/20 px-2.5 py-1 rounded-full font-bold">
              সক্রিয় মেস
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">{mess?.name || 'স্মার্ট মেস ড্যাশবোর্ড'}</h2>
            <p className="text-blue-100 text-xs font-medium">সহজ ও নিখুঁত মেস হিসাব নিকাশের ডিজিটাল প্লাটফর্ম।</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-3 min-w-[200px]">
            <div>
              <div className="text-[10px] text-blue-200 uppercase font-mono font-bold tracking-wider">ইনভাইট কোড (Invite Code)</div>
              <div className="text-base font-black font-mono mt-0.5 tracking-wider">{mess?.inviteCode}</div>
            </div>
            <button
              onClick={copyInvite}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white flex items-center justify-center cursor-pointer font-sans"
              title="Copy Code"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 left-6 bg-emerald-600 border border-emerald-500 rounded-lg px-2.5 py-1 text-[10px] font-bold text-emerald-50"
          >
            কোড কপি করা হয়েছে!
          </motion.div>
        )}
      </div>

      {/* Core Bento Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400">মোট খরচ (Total)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-base font-extrabold text-slate-805 tracking-tight leading-none">
              ৳ {totalMessExpenses.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">সব marketing ব্যয়</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400">মোট মিল count</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50/80 border border-blue-100/30 flex items-center justify-center text-blue-550">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-base font-extrabold text-slate-805 tracking-tight leading-none">
              {totalMessMeals}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block font-sans">Breakfast/Lunch/Dinner</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400">মিল রেট (Rate)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-base font-extrabold text-slate-805 tracking-tight leading-none">
              ৳ {mealRate}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">খরচ / মোট খাওয়া মিল</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400">মোট জমা</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-base font-extrabold text-slate-805 tracking-tight leading-none">
              ৳ {totalMessDeposits.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">অনুমোদিত ডিপোজিট</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400">হাতে নগদ (Cash)</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cashInHand >= 0 ? 'bg-sky-55 bg-sky-50 text-sky-500' : 'bg-rose-50 text-rose-500'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-base font-extrabold tracking-tight leading-none ${cashInHand >= 0 ? 'text-slate-805' : 'text-rose-600'}`}>
              ৳ {cashInHand.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">ব্যয়ের পর অবশিষ্ট তহবিল</span>
          </div>
        </div>
      </div>

      {/* Pending Membership Grid - Visible strictly to Manager */}
      {profile?.role === 'manager' && pendingMembersData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200/60 rounded-3xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold text-amber-900">মেম্বারশিপ অপেক্ষারত তালিকা ({pendingMembersData.length})</h3>
          </div>
          <div className="divide-y divide-amber-200/40">
            {pendingMembersData.map(m => (
              <div key={m.uid} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800">{m.displayName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{m.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveMember(m.uid)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> অনুমোদন করুন
                  </button>
                  <button
                    onClick={() => removeMember(m.uid)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> বাতিল
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Visual Analytics Block & Mini Ledger Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Marketing Expense Trend chart */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 md:col-span-2 space-y-4 flex justify-between flex-col">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 leading-tight">বাজারের দিনলিপি হিসাবচিত্র</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">সর্বশেষ ৭টি মার্কেটিং খরচের হিসাব রেখা</p>
              </div>
              <div className="text-xs font-semibold py-1 px-2.5 bg-slate-50 border border-slate-150 rounded-lg text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> খরচ ট্রেন্ড
              </div>
            </div>
            
            <div className="h-44 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', background: 'white', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value) => [`৳${value}`, 'খরচ পরিমাণ']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpent)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <TrendingUp className="w-10 h-10 stroke-[1.2] mb-1 text-slate-200" />
                  <span className="text-xs">হিসাবচিত্র উপলব্ধ করার জন্য খরচ যুক্ত করুন</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Helper Board & Quick Summary */}
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/60 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Info className="w-3.5 h-3.5 text-blue-500" /> প্রতিদিনের আপডেট (Daily)
            </h4>
            
            {/* Quick Summary View */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">আগামীকাল বাজার</span>
                <span className="text-xs font-black text-rose-600 font-mono tracking-wide">{tomorrowShopperName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">আজকের মেন্যু</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-slate-600">
                  <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                    <span className="text-[9px] block text-slate-400 font-bold mb-0.5">দুপুর</span>
                    {todayMenu?.lunch || '-'}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                    <span className="text-[9px] block text-slate-400 font-bold mb-0.5">রাত</span>
                    {todayMenu?.dinner || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100/50 rounded-2xl p-3.5 mt-4 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-blue-800 leading-relaxed font-semibold">
              ব্যালেন্স <strong className="text-emerald-700">পাবে</strong> মানে মেস মেম্বারের জমা বেশি আছে। <strong className="text-rose-600">দেবে</strong> মানে মেসের নিকট তার বকেয়া রয়েছে।
            </div>
          </div>
        </div>

      </div>

      {/* Main Individual Members Ledger Matrix */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Users className="w-5 h-5 text-blue-500" /> মেম্বার লেজার ও আর্থিক বিবরণী (Ledger Sheet)
            </h3>
            <p className="text-[10px] text-slate-400">সকল সক্রিয় সদস্যদের খাওয়া মিল, ডিপোজিট এবং জমা/বকেয়া ব্যালেন্সের নিখুঁত ছক</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="মেম্বার খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none transition-all font-semibold text-slate-700"
            />
          </div>
        </div>

        {/* Member list blocks */}
        <div className="overflow-x-auto selection:bg-blue-100">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">নাম ও ইমেইল (User Details)</th>
                <th className="py-2.5 px-3 text-center">মেম্বার পদ</th>
                <th className="py-2.5 px-3 text-center">মোট মিল (Meals)</th>
                <th className="py-2.5 px-3 text-center">জমা পরিমাণ (Deposit)</th>
                <th className="py-2.5 px-3 text-center">খাবার খরচ (Cost)</th>
                <th className="py-2.5 px-3 text-right">ব্যালেন্স বিবরণ (Balance)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {filteredActiveMembers.length > 0 ? (
                filteredActiveMembers.map(m => {
                  const isPositive = m.balance >= 0;
                  return (
                    <tr key={m.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800">{m.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{m.email}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${m.role === 'manager' ? 'bg-blue-50 text-blue-600 border border-blue-100/40' : m.role === 'accountant' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/40' : 'bg-slate-105 text-slate-600 border border-slate-200/50'}`}>
                          {m.role === 'manager' ? 'ম্যানেজার' : m.role === 'accountant' ? 'অ্যাকাউনটেন্ট' : 'সদস্য'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                        {m.totalMeals}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-805">
                        ৳{m.totalDeposits}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                        ৳{m.totalCost}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold leading-none ${isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-rose-50 text-rose-600 border border-rose-105/50'}`}>
                          {isPositive ? 'পাবে ৳' : 'দেবে ৳'}{Math.abs(m.balance)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-300 font-semibold">
                    কোন মেম্বার পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Manager role action if developer wants simple role updates */}
        {profile?.role === 'manager' && filteredActiveMembers.length > 0 && (
          <div className="pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-semibold">
            * মেম্বার ডিলিট বা সদস্য বাতিল করতে চাইলে মেস মেম্বার বা সেটিংস ট্যাব থেকে পরিবর্তন করতে পারেন।
          </div>
        )}
      </div>

    </div>
  );
}
