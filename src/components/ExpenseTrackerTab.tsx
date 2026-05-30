/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Trash2, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  User, 
  ShoppingCart, 
  Clock, 
  Users,
  Info
} from 'lucide-react';
import { ExpenseItem, ExpenseRecord } from '../types';

import { confirmAction } from '../lib/confirm';

export default function ExpenseTrackerTab() {
  const { 
    profile, 
    members, 
    expenses, 
    schedules, 
    addExpense, 
    deleteExpense, 
    addSchedule, 
    deleteSchedule 
  } = useApp();

  // --- 1. Expense Form States ---
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState<string>('');
  const [items, setItems] = useState<ExpenseItem[]>([{ name: '', price: 0 }]);
  const [addMode, setAddMode] = useState<boolean>(false);

  // --- 2. Schedule Form States ---
  const [schDate, setSchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [schUserUid, setSchUserUid] = useState<string>('');
  const [scheduleMode, setScheduleMode] = useState<boolean>(false);

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Expanded card tracking status for expense breakdowns
  const [expandedExpId, setExpandedExpId] = useState<string | null>(null);

  // Check if current user has permission to add expense
  const hasAddExpensePermission = useMemo(() => {
    if (profile?.role === 'manager' || profile?.role === 'accountant') return true;
    
    // Check if user is shopper today or tomorrow
    const today = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tmrw = d.toISOString().split('T')[0];
    
    const isShopper = schedules.some(s => s.userId === profile?.uid && (s.date === today || s.date === tmrw));
    return isShopper;
  }, [profile, schedules]);

  // Compute calculated sum of draft expense items
  const draftTotalAmount = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  }, [items]);

  // Handle addition of blank row in item breakdown
  const addItemRow = () => {
    setItems(prev => [...prev, { name: '', price: 0 }]);
  };

  // Handle removing a row
  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item field values
  const updateItemValue = (index: number, key: keyof ExpenseItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [key]: key === 'price' ? Number(value) || 0 : value
        };
      }
      return item;
    }));
  };

  // Submit Expense Record
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    // Filter out blank rows
    const validItems = items.filter(i => i.name.trim() && i.price > 0);
    if (validItems.length === 0) {
      setErrorMsg('দয়া করে অন্তত একটি আইটেম এবং এর সঠিক বাজার মূল্য দিন।');
      return;
    }
    
    try {
      await addExpense(expenseDate, draftTotalAmount, validItems, desc);
      
      // Reset form fields
      setItems([{ name: '', price: 0 }]);
      setDesc('');
      setAddMode(false);
      setSuccessMsg('বাজার খরচ সফলভাবে নথিভুক্ত করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorMsg('খরচ যুক্ত করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  // Submit Scheduler Assignment
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!schUserUid || !schDate) {
      setErrorMsg('তারিখ এবং বাজারকারীর নাম নির্বাচন করুন।');
      return;
    }

    const assignedMember = members.find(m => m.uid === schUserUid);
    if (!assignedMember) return;

    try {
      await addSchedule(schDate, schUserUid, assignedMember.displayName);
      setScheduleMode(false);
      setSuccessMsg('বাজারের সূচি সফলভাবে যুক্ত করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorMsg('বাজার সূচি সম্পাদন ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      
      {/* Shopper Schedule Duties Section */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-none">বাজার সূচি তালিকা (Shopping Schedule)</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">কে কোন তারিখে বাজার করার দ্বায়িত্বে আছেন তার তালিকা</p>
          </div>

          {(profile?.role === 'manager' || profile?.role === 'accountant') && (
            <button
              onClick={() => {
                setScheduleMode(prev => !prev);
                setAddMode(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {scheduleMode ? 'বন্ধ করুন' : 'সূচি নির্ধারণ করুন'}
            </button>
          )}
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

        {/* Schedule Add Form */}
        {scheduleMode && (profile?.role === 'manager' || profile?.role === 'accountant') && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleScheduleSubmit} 
            className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">বাজার করার তারিখ:</label>
                <input
                  type="date"
                  required
                  value={schDate}
                  onChange={(e) => setSchDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-250 focus:border-blue-500 text-xs font-medium text-slate-700 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500">বাজারকারী নির্বাচন করুন:</label>
                <select
                  required
                  value={schUserUid}
                  onChange={(e) => setSchUserUid(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-250 focus:border-blue-500 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="">নির্বাচন করুন...</option>
                  {members.filter(m => m.status === 'active').map(m => (
                    <option key={m.uid} value={m.uid}>{m.displayName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setScheduleMode(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-650 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                যুক্ত করুন
              </button>
            </div>
          </motion.form>
        )}

        {/* Schedule calendar display list */}
        <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-thin">
          {schedules.length > 0 ? (
            [...schedules]
              .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(sch => {
                const isToday = sch.date === new Date().toISOString().split('T')[0];
                return (
                  <div 
                    key={sch.scheduleId}
                    className={`flex-shrink-0 min-w-[130px] rounded-2xl p-3.5 border text-center relative ${isToday ? 'bg-blue-50 border-blue-205 text-blue-600 font-bold shadow-xs' : 'bg-slate-50/50 border-slate-150'}`}
                  >
                    {isToday && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-605 text-white text-[8px] font-black uppercase rounded-full tracking-wider leading-none">
                        আজকের দ্বায়িত্ব
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 font-bold font-mono tracking-wide">{sch.date}</div>
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200/60 mx-auto flex items-center justify-center text-slate-500 my-2 shadow-inner">
                      <User className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-xs font-bold text-slate-850 leading-tight">{sch.userName}</div>
                    
                    {(profile?.role === 'manager' || profile?.role === 'accountant') && (
                      <button
                        onClick={() => {
                          confirmAction('বাজারের এই সূচি কি মুছে ফেলতে চান?', () => deleteSchedule(sch.scheduleId));
                        }}
                        className="mt-2.5 text-[9px] text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                      >
                        বাতিল করুন
                      </button>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="w-full text-center py-4 bg-slate-50 border border-slate-150/40 rounded-2xl text-xs text-slate-400 font-semibold">
              আপাতত বাজারের কোনো দ্বায়িত্বসূচী পরিকল্পনা করা হয়নি।
            </div>
          )}
        </div>
      </div>

      {/* Daily Mess Expenses List / Creation */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-none">মেসের মার্কেটিং খরচ তালিকা (Market Expenses)</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">আইটেম ভিত্তিক বাজার খরচ পরিচালনার প্রফেশনাল লেজার ফিড</p>
          </div>

          {hasAddExpensePermission && (
            <button
              onClick={() => {
                setAddMode(prev => !prev);
                setScheduleMode(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> 
              {addMode ? 'বন্ধ করুন' : 'নতুন বাজার খরচ যোগ করুন'}
            </button>
          )}
        </div>

        {/* Expense builder form */}
        <AnimatePresence>
          {addMode && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleExpenseSubmit}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 overflow-hidden"
            >
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">বাজারের তারিখ:</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-250 focus:border-blue-500 text-xs font-medium text-slate-700 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">সংक्षिप्त বিবরণ/নোট (Description):</label>
                  <input
                    type="text"
                    placeholder="যেমন: চাল, মাংস, ডাল এবং কাঁচাবাজার"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-250 focus:border-blue-500 text-xs font-medium text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Dynamic item list rows */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    আইটেম বিবরণী ও মূল্য
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> আইটেম যুক্ত করুন
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder="আইটেম বা পণ্য নাম (যেমন: চাল ৫০ কেজি)"
                        value={item.name}
                        onChange={(e) => updateItemValue(index, 'name', e.target.value)}
                        className="flex-grow px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium text-slate-700"
                      />
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          required
                          placeholder="মূল্য"
                          value={item.price || ''}
                          onChange={(e) => updateItemValue(index, 'price', e.target.value)}
                          className="w-full pl-3 pr-6 py-1.5 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-blue-500 font-bold text-slate-800 text-right"
                        />
                        <span className="text-slate-400 absolute right-2 top-2 text-[10px]">৳</span>
                      </div>
                      
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-1 px-2.5 text-rose-500 hover:text-rose-700 bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sum totals */}
              <div className="flex border-t border-slate-200 pt-3.5 items-center justify-between">
                <div className="text-xs font-bold text-slate-500">
                  মোট হিসাবকৃত বাজার খরচ: <strong className="text-slate-800 font-black text-sm ml-1 font-mono">৳{draftTotalAmount}</strong>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddMode(false);
                      setItems([{ name: '', price: 0 }]);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    খরচ সাবমিট করুন (Submit Expense)
                  </button>
                </div>
              </div>

            </motion.form>
          )}
        </AnimatePresence>

        {/* Expenses Feed list */}
        <div className="space-y-3">
          {expenses.length > 0 ? (
            expenses.map(exp => {
              const expItems: ExpenseItem[] = JSON.parse(exp.items);
              const isExpanded = expandedExpId === exp.expenseId;

              return (
                <div 
                  key={exp.expenseId}
                  className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3 transition-shadow hover:shadow-inner"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-800">{exp.shopperName}</h4>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">{exp.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {exp.description || 'আইটেম ভিত্তিক দৈনিক মেস বাজার।' }
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-405 block">খরচ পরিমাণ</span>
                        <div className="text-base font-black text-rose-600 font-mono">৳{exp.amount}</div>
                      </div>

                      <button
                        onClick={() => setExpandedExpId(isExpanded ? null : exp.expenseId)}
                        className="p-1 px-2.5 text-xs text-slate-505 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        আইটেম {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible item breakdown panel */}
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white rounded-xl border border-slate-200/60 p-3.5 space-y-2 mt-2"
                    >
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        আইটেম বিবরণী (Receipt Breakdown)
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {expItems.map((it, idx) => (
                          <div key={idx} className="flex justify-between py-2 first:pt-0 last:pb-0 font-medium">
                            <span className="text-slate-650">{it.name}</span>
                            <span className="font-extrabold text-slate-800 font-mono">৳{it.price}</span>
                          </div>
                        ))}
                      </div>

                      {(profile?.role === 'manager' || profile?.role === 'accountant' || profile?.uid === exp.shopperUid) && (
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              confirmAction('এই বাজার খরচটি কি ডিলিট করতে চান?', () => deleteExpense(exp.expenseId));
                            }}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> খরচ বাতিল করুন
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-slate-50 border border-slate-150/40 rounded-2xl text-xs text-slate-400 font-semibold flex flex-col items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-slate-300 mb-1" />
              কোন খরচ যুক্ত করা হয়নি।
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
