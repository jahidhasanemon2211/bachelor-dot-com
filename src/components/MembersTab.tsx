/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserMinus, ShieldAlert, CircleCheck } from 'lucide-react';
import { motion } from 'motion/react';

import { confirmAction } from '../lib/confirm';

export default function MembersTab() {
  const { profile, members, approveMember, removeMember, changeMemberRole } = useApp();
  const [search, setSearch] = useState('');

  const filteredMembers = members.filter(m => 
    m.displayName.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 font-sans">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xs border border-slate-100 dark:border-slate-700 space-y-5">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              মেস সদস্য তালিকা
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">সব মেম্বারদের তালিকা এবং রোল পরিবর্তন</p>
          </div>
          <div className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-xs">
            মোট সদস্য: {members.length}
          </div>
        </div>

        <input
          type="text"
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
        />

        <div className="space-y-3">
          {filteredMembers.map(m => (
            <motion.div 
              key={m.uid}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-200 shadow-xs rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black shrink-0 ${m.status === 'active' ? 'bg-blue-600' : 'bg-slate-400'}`}>
                  {m.displayName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {m.displayName}
                    {m.status === 'pending' && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200">Pending</span>}
                  </h4>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {profile?.role === 'manager' && m.uid !== profile.uid ? (
                  <div className="flex flex-col gap-1 w-full md:w-auto">
                    <label className="text-[9px] uppercase font-bold text-slate-400">রোল পরিবর্তন</label>
                    <select
                      value={m.role}
                      onChange={(e) => changeMemberRole(m.uid, e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 cursor-pointer shadow-xs min-w-[120px]"
                    >
                      <option value="member">সদস্য (Member)</option>
                      <option value="accountant">অ্যাকাউনটেন্ট</option>
                      <option value="manager">ম্যানেজার</option>
                    </select>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 mr-2">
                    {m.role === 'manager' ? 'ম্যানেজার' : m.role === 'accountant' ? 'অ্যাকাউনটেন্ট' : 'সদস্য'}
                  </div>
                )}
                
                {profile?.role === 'manager' && m.status === 'pending' && (
                  <button onClick={() => approveMember(m.uid)} className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors" title="Approve Member">
                    <CircleCheck className="w-4 h-4" />
                  </button>
                )}
                
                {profile?.role === 'manager' && m.uid !== profile.uid && (
                  <button onClick={() => {
                    confirmAction('এই সদস্যকে কি মেস থেকে রিমুভ করতে চান?', () => removeMember(m.uid));
                  }} className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors" title="Remove Member">
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredMembers.length === 0 && (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400">কোন সদস্য পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
