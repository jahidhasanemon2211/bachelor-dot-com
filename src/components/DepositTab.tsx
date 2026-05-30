/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Wallet, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  Settings, 
  Trash2,
  Calendar,
  DollarSign,
  ShoppingCart,
  ArrowDownCircle,
  ArrowUpCircle,
  Users
} from 'lucide-react';
import { DepositRecord, ShopperFundRecord } from '../types';

import { confirmAction } from '../lib/confirm';

export default function DepositTab() {
  const { 
    profile, 
    deposits, 
    members,
    expenses,
    shopperFunds,
    addDeposit, 
    approveDeposit, 
    deleteDeposit,
    addShopperFund,
    deleteShopperFund
  } = useApp();

  const [viewMode, setViewMode] = useState<'deposits' | 'shopperFunds'>('deposits');

  // Deposits State
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositDate, setDepositDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [addMode, setAddMode] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Shopper Funds State
  const [fundAddMode, setFundAddMode] = useState<boolean>(false);
  const [fundType, setFundType] = useState<'advance' | 'return'>('advance');
  const [fundAmount, setFundAmount] = useState<number>(0);
  const [fundUserId, setFundUserId] = useState<string>('');
  const [fundDate, setFundDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fundAmount <= 0 || !fundUserId) return;
    const user = members.find(m => m.uid === fundUserId);
    if (!user) return;

    await addShopperFund(user.uid, user.displayName, fundAmount, fundType, fundDate);
    setFundAmount(0);
    setFundAddMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (depositAmount <= 0) {
      setErrorMsg('সঠিক ও পজিটিভ পরিমাণ টাকা দিন।');
      return;
    }

    try {
      await addDeposit(depositDate, depositAmount);
      setDepositAmount(0);
      setAddMode(false);
      setSuccessMsg('ডিপোজিট রিকুয়েস্ট সফলভাবে প্রেরিত হয়েছে, ম্যানেজার অনুমোদন করলে তা তহবিলে যুক্ত হবে!');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorMsg('আমানত রিকুয়েস্ট প্রেরণ ব্যর্থ হয়েছে।');
    }
  };

  // Filter pending deposits for managers to approve
  const pendingDeposits = useMemo(() => {
    return deposits.filter(d => d.status === 'pending');
  }, [deposits]);

  // Filter approved deposits
  const approvedDeposits = useMemo(() => {
    return deposits.filter(d => d.status === 'approved');
  }, [deposits]);

  const isManagerOrAccountant = profile?.role === 'manager' || profile?.role === 'accountant';

  return (
    <div className="space-y-6 pb-20 font-sans">
      
      {/* Top Toggle */}
      <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs max-w-sm mx-auto">
        <button
          onClick={() => setViewMode('deposits')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${viewMode === 'deposits' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <Wallet className="w-3.5 h-3.5 inline-block mr-1.5" />
          রুকসানা আমানত
        </button>
        <button
          onClick={() => setViewMode('shopperFunds')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${viewMode === 'shopperFunds' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <ShoppingCart className="w-3.5 h-3.5 inline-block mr-1.5" />
          বাজারকারী ফান্ড
        </button>
      </div>

      {viewMode === 'deposits' && (
        <div className="space-y-6">
          {/* 💳 Manager/Accountant Approvals Queue */}
          {isManagerOrAccountant && pendingDeposits.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-100 rounded-3xl p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <h3 className="text-sm font-extrabold text-blue-900 leading-none">
              অপেক্ষমান ডিপোজিট অনুমোদন তালিকা ({pendingDeposits.length})
            </h3>
          </div>

          <div className="divide-y divide-blue-105/40">
            {pendingDeposits.map(dep => (
              <div key={dep.depositId} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-800">{dep.userName}</div>
                  <div className="text-[10px] text-blue-750 font-mono flex items-center gap-1 font-bold">
                    <Calendar className="w-3 h-3 text-blue-500" /> {dep.date}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">আবেদনের পরিমাণ</span>
                    <strong className="text-sm text-slate-800 font-mono font-black">৳{dep.amount}</strong>
                  </div>

                  <button
                    onClick={() => approveDeposit(dep.depositId)}
                    className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> অনুমোদন
                  </button>

                  <button
                    onClick={() => {
                      confirmAction('আমানতের আবেদন কি বাতিল করতে চান?', () => deleteDeposit(dep.depositId));
                    }}
                    className="p-2 text-rose-500 bg-white hover:bg-rose-50 border border-rose-100 rounded-xl cursor-pointer"
                    title="বাতিল করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Member/Manager contribution tracking form */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-none">আমার আমানত ও তহবিল (Payments Tracker)</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">মেসের তহবিল পরিচালনা ও ব্যক্তিগত জমা টাকার ডিজিটাল রেকর্ড বুক</p>
          </div>

          <button
            onClick={() => {
              setAddMode(prev => !prev);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-855 hover:bg-slate-900 bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {addMode ? 'বন্ধ করুন' : 'টাকা জমা দিন (Deposit)'}
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-100/50 text-emerald-800 font-semibold rounded-2xl text-xs">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100/50 text-rose-750 font-semibold rounded-2xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* Deposit request form */}
        <AnimatePresence>
          {addMode && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSubmit}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">জমার তারিখ:</label>
                  <input
                    type="date"
                    required
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-250 font-medium text-xs text-slate-700 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">জমা পরিমাণ (Amount in Taka):</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="যেমন: ৩০০০"
                      value={depositAmount || ''}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-white border border-slate-250 font-extrabold text-xs text-slate-850 outline-none focus:border-blue-500 text-right"
                    />
                    <span className="text-slate-400 absolute right-3 top-2.5 text-xs font-bold">৳</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAddMode(false);
                    setDepositAmount(0);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-650 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  সাবমিট ডিপোজিট (Submit Cash)
                </button>
              </div>

            </motion.form>
          )}
        </AnimatePresence>

        {/* Dynamic deposits feed display list */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            আমানত লেনদেন ফিড (Transaction Stream)
          </div>

          {deposits.length > 0 ? (
            deposits.map(dep => {
              const isApproved = dep.status === 'approved';
              return (
                <div 
                  key={dep.depositId}
                  className="flex justify-between items-center p-3.5 bg-slate-50/50 border border-slate-150 rounded-2xl"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-3 text-slate-500" />
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 leading-none">{dep.userName}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold block">{dep.date}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">আমানত</span>
                      <strong className="text-sm font-black text-slate-800 font-mono">৳{dep.amount}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-bold ${isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {isApproved ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
                        {isApproved ? 'অনুমোদিত' : 'অপেক্ষমান'}
                      </span>

                      {/* Manual delete capability for users pending deposits */}
                      {(profile?.role === 'manager' || profile?.role === 'accountant') && (
                        <button
                          onClick={() => {
                            confirmAction('এই আমানতটি তালিকা থেকে মুছে ফেলতে চান?', () => deleteDeposit(dep.depositId));
                          }}
                          className="p-1 px-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-slate-50 border border-slate-150/40 rounded-2xl text-xs text-slate-400 font-semibold flex flex-col items-center justify-center">
              <Wallet className="w-8 h-8 text-slate-300 mb-1" />
              কোন আমানত রেকর্ড জমা পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {viewMode === 'shopperFunds' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xs border border-slate-100 dark:border-slate-700 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">বাজারকারী ফান্ড</h3>
                <p className="text-[10px] text-slate-400 mt-1.5">কাউকে বাজারের জন্য টাকা দেওয়া এবং বাজার শেষে ফেরত নেওয়া</p>
              </div>

              {isManagerOrAccountant && (
                <button
                  onClick={() => setFundAddMode(!fundAddMode)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {fundAddMode ? 'বন্ধ করুন' : 'ফান্ড পরিচালনা'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {fundAddMode && isManagerOrAccountant && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleFundSubmit}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4 overflow-hidden"
                >
                  <div className="flex gap-2 mb-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => setFundType('advance')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${fundType === 'advance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500'}`}>টাকা দেওয়া হয়েছে (Advance)</button>
                    <button type="button" onClick={() => setFundType('return')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${fundType === 'return' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'text-slate-500'}`}>টাকা ফেরত দিয়েছে (Return)</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">সদস্য নির্বাচন:</label>
                      <select required value={fundUserId} onChange={(e) => setFundUserId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer">
                        <option value="">সদস্য নির্বাচন করুন</option>
                        {members.map(m => <option key={m.uid} value={m.uid}>{m.displayName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">পরিমাণ (Amount):</label>
                      <input type="number" required min={1} value={fundAmount || ''} onChange={(e) => setFundAmount(Number(e.target.value))} placeholder="টাকার পরিমাণ..." className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-850 dark:text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">তারিখ:</label>
                      <input type="date" required value={fundDate} onChange={(e) => setFundDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button type="submit" className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer ${fundType === 'advance' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                      {fundType === 'advance' ? 'টাকা দিন' : 'হিসাবে যোগ করুন (Return)'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Shopper Balances List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> বাজারকারীদের হিসাব
              </h4>
              
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {members.map(member => {
                  const memberFunds = shopperFunds.filter(f => f.userId === member.uid);
                  const memberExpenses = expenses.filter(e => e.shopperUid === member.uid);
                  
                  const totalAdvs = memberFunds.filter(f => f.type === 'advance').reduce((a, b) => a + b.amount, 0);
                  const totalRts = memberFunds.filter(f => f.type === 'return').reduce((a, b) => a + b.amount, 0);
                  const totalBazar = memberExpenses.reduce((a, b) => a + b.amount, 0);
                  
                  const currentHandHold = totalAdvs - totalRts - totalBazar;
                  if (totalAdvs === 0 && totalBazar === 0) return null; // Hide if no interaction

                  return (
                    <div key={member.uid} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs">
                          {member.displayName.charAt(0)}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-none">{member.displayName}</h4>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase mb-0.5">টাকা দেওয়া</span>
                          <span className="text-xs font-black text-emerald-600">৳{totalAdvs}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase mb-0.5">ফেরত দিয়েছে</span>
                          <span className="text-xs font-black text-amber-600">৳{totalRts}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase mb-0.5">বাজার করেছে</span>
                          <span className="text-xs font-black text-rose-500">৳{totalBazar}</span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl border text-center flex items-center justify-between px-3 ${currentHandHold > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : currentHandHold < 0 ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'}`}>
                        <span className="text-[10px] font-bold uppercase">বর্তমান হাতে আছে:</span>
                        <span className="text-sm font-black font-mono">৳{currentHandHold}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Shopper Transaction Logs */}
            <div className="mt-8 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ফান্ড লেনদেন লগ</h4>
              <div className="space-y-2">
                {shopperFunds.length > 0 ? shopperFunds.map(fund => (
                  <div key={fund.fundId} className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 dark:border-slate-700 last:border-0">
                    <div className="flex items-center gap-2">
                      {fund.type === 'advance' ? <ArrowDownCircle className="w-4 h-4 text-emerald-500" /> : <ArrowUpCircle className="w-4 h-4 text-amber-500" />}
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{fund.userName} <span className="text-[9px] text-slate-400 font-normal">({fund.type === 'advance' ? 'Advance' : 'Return'})</span></div>
                        <div className="text-[9px] text-slate-400 font-mono">{fund.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-xs font-black p-1 px-2 rounded-lg ${fund.type === 'advance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30'}`}>
                        {fund.type === 'advance' ? '+' : '-'} ৳{fund.amount}
                      </div>
                      {isManagerOrAccountant && (
                        <button onClick={() => {
                          confirmAction('এই লেনদেন মুছে ফেলতে চান?', () => deleteShopperFund(fund.fundId));
                        }} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-[11px] text-slate-400 font-medium">কোন লেনদেন লগ নেই</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
