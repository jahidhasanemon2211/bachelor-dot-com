/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, CheckCircle2, MessageSquare, Send, ThumbsDown, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { confirmAction } from '../lib/confirm';

export default function ComplaintsTab() {
  const { profile, complaints, addComplaint, updateComplaintStatus, deleteComplaint } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;
    await addComplaint(title, desc);
    setTitle('');
    setDesc('');
    setShowAddForm(false);
  };

  const isManager = profile?.role === 'manager';

  return (
    <div className="space-y-6 pb-20 font-sans">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xs border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-slate-800 dark:text-white">অভিযোগ বাক্স</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">মিল বা মেসের যেকোনো সমসসায় অভিযোগ করুন (গোপনীয়)</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            {showAddForm ? <XCircle className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            {showAddForm ? 'বাতিল' : 'নতুন অভিযোগ'}
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit} 
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 overflow-hidden"
            >
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">অভিযোগের বিষয়</label>
                <input 
                  type="text" required
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: দুপুরের খাবারে সমস্যা"
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 outline-none focus:border-rose-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">বিস্তারিত</label>
                <textarea 
                  required rows={3}
                  value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="আপনার অভিযোগটি বিস্তারিত লিখুন..."
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 outline-none focus:border-rose-400 transition-colors"
                />
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer">
                  <Send className="w-3 h-3" /> অভিযোগ জমা দিন
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-4 pt-2">
          {complaints.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-400">কোনো অভিযোগ পাওয়া যায়নি</span>
            </div>
          ) : (
            complaints.map((comp) => {
              const isMine = comp.userId === profile?.uid;
              // If not manager and not mine, skip (Rule protects it anyway, but extra filter)
              if (!isManager && !isMine) return null;

              return (
                <div key={comp.complaintId} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 relative bg-white dark:bg-slate-800 shadow-xs">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{comp.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                        {comp.description}
                      </p>
                      <div className="text-[9px] text-slate-400 mt-2 font-mono flex items-center gap-2">
                        <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
                        {isManager && <span className="font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">@{comp.userName}</span>}
                      </div>
                    </div>
                    <div>
                      {comp.status === 'pending' && <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[9px] font-bold">Pending</span>}
                      {comp.status === 'approved' && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-[9px] font-bold">Approved</span>}
                      {comp.status === 'rejected' && <span className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-[9px] font-bold">Rejected</span>}
                    </div>
                  </div>

                  {comp.managerReply && (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl p-3 mt-2 relative">
                      <span className="absolute -top-2 left-3 bg-white dark:bg-slate-800 px-1.5 text-[8px] font-black uppercase text-blue-500 tracking-wider">ম্যানেজারের উত্তর</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{comp.managerReply}</p>
                    </div>
                  )}

                  {isManager && comp.status === 'pending' && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                      <textarea
                        value={replyText[comp.complaintId] || ''}
                        onChange={(e) => setReplyText({...replyText, [comp.complaintId]: e.target.value})}
                        placeholder="রিপ্লাই দিন..."
                        rows={2}
                        className="w-full text-xs font-medium p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateComplaintStatus(comp.complaintId, 'approved', replyText[comp.complaintId] || '')}
                          disabled={!replyText[comp.complaintId]}
                          className="flex-1 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 border border-emerald-200 outline-none text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          সমাধান করুন (Approve)
                        </button>
                        <button 
                          onClick={() => updateComplaintStatus(comp.complaintId, 'rejected', replyText[comp.complaintId] || '')}
                          disabled={!replyText[comp.complaintId]}
                          className="flex-1 py-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-700 border border-rose-200 outline-none text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          বাতিল করুন (Reject)
                        </button>
                      </div>
                    </div>
                  )}

                  {isMine && comp.status === 'pending' && (
                     <button
                        onClick={() => {
                          confirmAction('অভিযোগ মুছে ফেলতে চান?', () => deleteComplaint(comp.complaintId));
                        }}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                      >
                        মুছে ফেলুন
                     </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
