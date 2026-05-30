/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Plus, 
  Minus, 
  Clock, 
  CheckCircle2, 
  UtensilsCrossed, 
  Check, 
  Edit3
} from 'lucide-react';

export default function MealManagerTab() {
  const { profile, members, meals, updateMeal, requestMeals } = useApp();

  // Selected date formatting (defaults to today)
  const getLocalDateString = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(0));
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Tomorrow date string for Member Meal Requests
  const tomorrowDate = useMemo(() => getLocalDateString(1), []);

  // Fetch tomorrow's request for active user
  const tomorrowUserRecord = useMemo(() => {
    if (!profile) return null;
    return meals.find(m => m.userId === profile.uid && m.date === tomorrowDate) || null;
  }, [meals, profile, tomorrowDate]);

  // Tomorrow meal request draft status states
  const [reqBF, setReqBF] = useState<number>(tomorrowUserRecord?.reqBreakfast ?? 1);
  const [reqLU, setReqLU] = useState<number>(tomorrowUserRecord?.reqLunch ?? 1);
  const [reqDI, setReqDI] = useState<number>(tomorrowUserRecord?.reqDinner ?? 1);

  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Trigger state update on loading record
  React.useEffect(() => {
    if (tomorrowUserRecord) {
      setReqBF(tomorrowUserRecord.reqBreakfast);
      setReqLU(tomorrowUserRecord.reqLunch);
      setReqDI(tomorrowUserRecord.reqDinner);
    }
  }, [tomorrowUserRecord]);

  // Submit tomorrows request
  const handleRequestSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await requestMeals(tomorrowDate, reqBF, reqLU, reqDI);
      setSuccessMsg('আপনার আগামীকালকের মিল রিকুয়েস্ট সফলভাবে আপডেট করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setErrorMsg('রিকুয়েস্ট আপডেট করতে ব্যর্থ হয়েছে।');
    }
  };

  // Adjust offset of selected date
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Gather active components for selected date
  const activeMealsMap = useMemo(() => {
    const map: { [userId: string]: typeof meals[0] } = {};
    meals.forEach(m => {
      if (m.date === selectedDate) {
        map[m.userId] = m;
      }
    });
    return map;
  }, [meals, selectedDate]);

  // Handle manually updating a member's meals (Manager authorization)
  const handleMealChange = async (userId: string, userName: string, type: 'breakfast' | 'lunch' | 'dinner', delta: number) => {
    const currentMeal = activeMealsMap[userId];
    const currentVal = currentMeal ? (currentMeal[type] || 0) : 0;
    const newVal = Math.max(0, currentVal + delta);
    await updateMeal(userId, userName, selectedDate, type, newVal);
  };

  // Calculate daily totals for breakfast, lunch, dinner
  const dailyTotals = useMemo(() => {
    let breakfast = 0;
    let lunch = 0;
    let dinner = 0;
    members.forEach(m => {
      const record = activeMealsMap[m.uid];
      if (record) {
        breakfast += record.breakfast || 0;
        lunch += record.lunch || 0;
        dinner += record.dinner || 0;
      }
    });
    return { breakfast, lunch, dinner, total: breakfast + lunch + dinner };
  }, [members, activeMealsMap]);

  return (
    <div className="space-y-6 pb-20 font-sans">
      
      {/* ⚠️ Cut-off warning notice & Member Meal Request Board */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-start gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-100/70">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-amber-900">
            <h4 className="font-bold">গুরুত্বপূর্ণ বিজ্ঞপ্তি (Alert Cut-off)</h4>
            <p className="leading-relaxed">
              পরবর্তী দিনের মিল অন/অফ বা আপডেট করার সময়সীমা প্রতিদিন <strong>রাত ১০:০০ টা</strong> পর্যন্ত। দয়া করে এই সময়ের পূর্বে আগামীকালকের মিল নির্ধারণ করুন।
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold rounded-2xl text-xs">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-750 font-semibold rounded-2xl text-xs">
            {errorMsg}
          </div>
        )}

        <div className="pt-2">
          <div className="flex items-center gap-1.5 mb-3.5">
            <div className="w-1.5 h-3 bg-blue-600 rounded-full" />
            <h3 className="text-sm font-extrabold text-slate-800 leading-none">
              আগামীকালকের মিল রিকuয়েস্ট ({tomorrowDate})
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Breakfast Selector */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 text-center flex flex-col items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">সকালের মিল (BF)</span>
              <div className="flex items-center gap-2.5 my-3">
                <button
                  onClick={() => setReqBF(prev => Math.max(0, prev - 0.5))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer text-sm font-mono"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-base font-extrabold text-slate-800 font-mono w-6">{reqBF}</span>
                <button
                  onClick={() => setReqBF(prev => Math.min(5, prev + 0.5))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer text-sm font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-blue-600 font-bold bg-blue-50/60 px-2 py-0.5 rounded-full">সকালের ব্রেকফাস্ট</span>
            </div>

            {/* Lunch Selector */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 text-center flex flex-col items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">দুপুরের মিল (Lunch)</span>
              <div className="flex items-center gap-2.5 my-3">
                <button
                  onClick={() => setReqLU(prev => Math.max(0, prev - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer text-sm font-mono animate-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-base font-extrabold text-slate-800 font-mono w-6">{reqLU}</span>
                <button
                  onClick={() => setReqLU(prev => Math.min(5, prev + 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer text-sm font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-blue-600 font-bold bg-blue-50/60 px-2 py-0.5 rounded-full">ভাত ও অন্যান্য</span>
            </div>

            {/* Dinner Selector */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 text-center flex flex-col items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">রাতের মিল (Dinner)</span>
              <div className="flex items-center gap-2.5 my-3">
                <button
                  onClick={() => setReqDI(prev => Math.max(0, prev - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer text-sm font-mono"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-base font-extrabold text-slate-800 font-mono w-6">{reqDI}</span>
                <button
                  onClick={() => setReqDI(prev => Math.min(5, prev + 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 cursor-pointer text-sm font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[9px] text-blue-600 font-bold bg-blue-50/60 px-2 py-0.5 rounded-full">রাতের খাবার</span>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleRequestSubmit}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> রিকুয়েস্ট সাবমিট করুন (Submit Request)
            </button>
          </div>
        </div>
      </div>

      {/* Date-picker Navigation */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-none">মিল শীট খতিয়ান (Daily Sheets)</h3>
            <p className="text-[10px] text-slate-400 mt-1">তারিখ অনুযায়ী মেসে সদস্যদের প্রতিদিনের খাওয়ার মিল ডেটা</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-slate-700 px-2 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> {selectedDate}
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Daily Stats Bar */}
        <div className="grid grid-cols-4 gap-2 bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl">
          <div className="text-center border-r border-blue-150/40 last:border-0">
            <div className="text-[10px] font-bold text-blue-600 leading-none">সকাল (BF)</div>
            <div className="text-lg font-black font-mono text-slate-800 mt-1">{dailyTotals.breakfast}</div>
          </div>
          <div className="text-center border-r border-blue-150/40 last:border-0">
            <div className="text-[10px] font-bold text-blue-600 leading-none">দুপুর (Lunch)</div>
            <div className="text-lg font-black font-mono text-slate-800 mt-1">{dailyTotals.lunch}</div>
          </div>
          <div className="text-center border-r border-blue-150/40 last:border-0">
            <div className="text-[10px] font-bold text-blue-600 leading-none">রাত (Dinner)</div>
            <div className="text-lg font-black font-mono text-slate-800 mt-1">{dailyTotals.dinner}</div>
          </div>
          <div className="text-center border-r border-blue-150/40 last:border-0">
            <div className="text-[10px] font-bold text-blue-600 leading-none">মোট মিল</div>
            <div className="text-lg font-black font-mono text-slate-800 mt-1">{dailyTotals.total}</div>
          </div>
        </div>

        {/* Meal breakdown table/list */}
        <div className="space-y-3">
          {members.filter(m => m.status === 'active').map(m => {
            const record = activeMealsMap[m.uid];
            const bfCount = record ? (record.breakfast || 0) : 0;
            const luCount = record ? (record.lunch || 0) : 0;
            const diCount = record ? (record.dinner || 0) : 0;
            const userTotal = bfCount + luCount + diCount;

            const isEditing = editingUserId === m.uid;

            return (
              <div 
                key={m.uid}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150/40 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
              >
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    {m.displayName}
                    {m.role === 'manager' && (
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">ম্যানেজার</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{m.email}</span>
                </div>

                <div className="flex items-center gap-4 py-2 sm:py-0 justify-between sm:justify-end border-t border-slate-200/50 sm:border-0 pt-2 sm:pt-0">
                  
                  {isEditing && profile?.role === 'manager' ? (
                    <div className="flex items-center gap-4">
                      {/* Interactive edit inputs */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">সকাল</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleMealChange(m.uid, m.displayName, 'breakfast', -0.5)}
                            className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-105 text-xs flex items-center justify-center font-bold rounded font-mono"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-slate-705 min-w-5 text-center">{bfCount}</span>
                          <button
                            onClick={() => handleMealChange(m.uid, m.displayName, 'breakfast', 0.5)}
                            className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-105 text-xs flex items-center justify-center font-bold rounded font-mono"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">দুপুর</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleMealChange(m.uid, m.displayName, 'lunch', -1)}
                            className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-105 text-xs flex items-center justify-center font-bold rounded font-mono"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-slate-705 min-w-5 text-center">{luCount}</span>
                          <button
                            onClick={() => handleMealChange(m.uid, m.displayName, 'lunch', 1)}
                            className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-105 text-xs flex items-center justify-center font-bold rounded font-mono"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">রাত</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleMealChange(m.uid, m.displayName, 'dinner', -1)}
                            className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-105 text-xs flex items-center justify-center font-bold rounded font-mono"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-slate-705 min-w-5 text-center">{diCount}</span>
                          <button
                            onClick={() => handleMealChange(m.uid, m.displayName, 'dinner', 1)}
                            className="w-5.5 h-5.5 bg-white border border-slate-200 hover:bg-slate-105 text-xs flex items-center justify-center font-bold rounded font-mono"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingUserId(null)}
                        className="p-1 px-2.5 bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> শেষ
                      </button>
                    </div>
                  ) : (
                    // Read display
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="text-[11px] text-slate-500 bg-white border border-slate-250/20 rounded-lg px-2 py-0.5 font-bold">
                          সকাল: <strong className="font-mono text-slate-800">{bfCount}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 bg-white border border-slate-250/20 rounded-lg px-2 py-0.5 font-bold">
                          দুপুর: <strong className="font-mono text-slate-800">{luCount}</strong>
                        </div>
                        <div className="text-[11px] text-slate-500 bg-white border border-slate-250/20 rounded-lg px-2 py-0.5 font-bold">
                          রাত: <strong className="font-mono text-slate-800">{diCount}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[9px] text-slate-400 uppercase font-mono font-bold">সারাদিন মোট</div>
                        <div className="text-sm font-black text-slate-800 font-mono inline-block leading-none mt-0.5">{userTotal}</div>
                      </div>

                      {/* Edit click button (for manager only) */}
                      {profile?.role === 'manager' && (
                        <button
                          onClick={() => setEditingUserId(m.uid)}
                          className="p-1.5 border border-slate-200/80 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="মিল সংশোধন করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
