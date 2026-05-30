/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Calendar, Plus, ChefHat, LayoutGrid } from 'lucide-react';

const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAYS_BENGALI: Record<string, string> = {
  'Saturday': 'শনিবার',
  'Sunday': 'রবিবার',
  'Monday': 'সোমবার',
  'Tuesday': 'মঙ্গলবার',
  'Wednesday': 'বুধবার',
  'Thursday': 'বৃহস্পতিবার',
  'Friday': 'শুক্রবার',
};

export default function RoutineTab() {
  const { profile, routines, addRoutine } = useApp();
  const isManager = profile?.role === 'manager';

  const [editMode, setEditMode] = useState<string | null>(null);
  const [bf, setBf] = useState('');
  const [lun, setLun] = useState('');
  const [din, setDin] = useState('');
  const [msg, setMsg] = useState('');

  const startEdit = (day: string) => {
    setMsg('');
    const routine = routines.find(r => r.dayOfWeek === day);
    setBf(routine?.breakfast || '');
    setLun(routine?.lunch || '');
    setDin(routine?.dinner || '');
    setEditMode(day);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMode) return;
    try {
      await addRoutine(editMode, bf, lun, din);
      setMsg(`${DAYS_BENGALI[editMode]}-এর রুটিন সেভ করা হয়েছে`);
      setEditMode(null);
      setTimeout(() => setMsg(''), 4000);
    } catch {
      setMsg('রুটিন সেভ করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-800">সাপ্তাহিক ও মাসিক মিল রুটিন</h3>
            <p className="text-[10px] text-slate-400 mt-1">সপ্তাহের প্রতিদিনের খাবার মেন্যু কি হবে তার রুটিন</p>
          </div>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100">
            {msg}
          </div>
        )}

        <div className="space-y-3 pt-2">
          {DAYS_OF_WEEK.map(day => {
            const routine = routines.find(r => r.dayOfWeek === day);
            const isEditing = editMode === day;

            return (
              <div key={day} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
                <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                  <span className="text-sm font-extrabold text-slate-800">{DAYS_BENGALI[day]}</span>
                  {isManager && !isEditing && (
                    <button
                      onClick={() => startEdit(day)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs cursor-pointer"
                    >
                      এডিট রুটিন
                    </button>
                  )}
                </div>
                
                <div className="bg-white p-4">
                  {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">সকালের নাস্তা</label>
                          <input 
                            value={bf} onChange={e=>setBf(e.target.value)} 
                            placeholder="যেমন: খিচুড়ি, ডিম"
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">দুপুরের খাবার</label>
                          <input 
                            value={lun} onChange={e=>setLun(e.target.value)} 
                            placeholder="যেমন: ভাত, গরুর মাংস, ডাল"
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">রাতের খাবার</label>
                          <input 
                            value={din} onChange={e=>setDin(e.target.value)} 
                            placeholder="যেমন: ভাত, মাছ, সবজি"
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={()=>setEditMode(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">বাতিল</button>
                        <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs">সেভ করুন</button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">সকাল</span>
                        <div className="text-xs font-medium text-slate-700">{routine?.breakfast || '-'}</div>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">দুপুর</span>
                        <div className="text-xs font-medium text-slate-700">{routine?.lunch || '-'}</div>
                      </div>
                      <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">রাত</span>
                        <div className="text-xs font-medium text-slate-700">{routine?.dinner || '-'}</div>
                      </div>
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
