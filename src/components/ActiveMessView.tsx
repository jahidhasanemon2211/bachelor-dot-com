/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  Wallet2, 
  Bell, 
  LogOut, 
  Settings, 
  CalendarCheck,
  ChevronRight,
  Sparkles,
  Users,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';

import DashboardTab from './DashboardTab';
import MealManagerTab from './MealManagerTab';
import ExpenseTrackerTab from './ExpenseTrackerTab';
import DepositTab from './DepositTab';
import RoutineTab from './RoutineTab';
import MembersTab from './MembersTab';
import ComplaintsTab from './ComplaintsTab';

import { confirmAction } from '../lib/confirm';

export default function ActiveMessView() {
  const { profile, mess, members, notifications, signOut, leaveOrDeleteMess, clearAllNotifications } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'expenses' | 'deposits' | 'routines' | 'members' | 'complaints' | 'notifications'>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  
  // Theme toggle state
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Pop-up effect on new notifications
  const [prevNotifCount, setPrevNotifCount] = useState<number>(0);
  React.useEffect(() => {
    if (notifications.length > prevNotifCount && prevNotifCount !== 0) {
      // New notification arrived in realtime
      import('react-hot-toast').then(({ default: toast }) => {
        const latest = notifications[0];
        if (latest) {
          toast.success(latest.title + '\n' + latest.message, { duration: 4000 });
        }
      });
    }
    setPrevNotifCount(notifications.length);
  }, [notifications]);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Filter and display list
  const tabItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'meals', label: 'মিল শীট', icon: UtensilsCrossed },
    { id: 'expenses', label: 'বাজার তালিকা', icon: ShoppingCart },
    { id: 'deposits', label: 'আমানত', icon: Wallet2 },
    { id: 'routines', label: 'মিল রুটিন', icon: CalendarCheck },
    { id: 'members', label: 'সদস্যগণ', icon: Users },
    { id: 'complaints', label: 'অভিযোগ', icon: AlertCircle },
    { id: 'notifications', label: 'বিজ্ঞপ্তি', icon: Bell, badge: notifications.length > 0 ? notifications.length : 0 },
  ];

  const handleLeave = () => {
    const isManager = profile?.role === 'manager';
    const confirmMsg = isManager 
      ? 'আপনি মেসের ম্যানেজার। আপনি মেস থেকে বের হয়ে গেলে মেম্বাররা আর এক্সেস পাবে না (রেকর্ডস মুছে যাবে)। আপনি কি নিশ্চিত বের হতে চান?'
      : 'আপনি কি নিশ্চিত এই মেস গ্রুপ ত্যাগ বা লিভ করতে চান?';
    
    confirmAction(confirmMsg, () => {
      leaveOrDeleteMess();
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans relative">
      
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col shrink-0 hidden md:flex h-screen sticky top-0 border-r border-slate-800 shadow-xl">
        <div className="p-6 flex items-center gap-3 text-white border-b border-white/5">
          <img 
            src="/logo.png" 
            alt="Bachelor dot com logo" 
            className="w-10 h-10 rounded-full object-contain shadow-lg shadow-blue-500/20 bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=B&background=4f46e5&color=fff&rounded=true';
            }}
          />
          <div>
            <span className="text-sm font-bold tracking-tight block leading-none text-white w-full truncate">ব্যাচেলর ডট কম</span>
            <span className="text-[8px] text-blue-400 font-mono tracking-widest uppercase font-bold block mt-1">Professional</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabItems.map(item => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${isSelected ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
              >
                <div className="relative">
                  <Icon className="w-4.5 h-4.5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[7px] font-bold text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/5 bg-slate-950/20">
          <div className="flex items-center gap-3 px-2.5 py-2 bg-slate-800/20 border border-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate leading-none">{profile?.displayName}</p>
              <p className="text-[9px] text-slate-500 truncate mt-1">{profile?.role === 'manager' ? 'মেস ম্যানেজার' : 'মেম্বার'}</p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main page content layout container */}
      <div className="flex-1 flex flex-col justify-between min-h-screen dark:bg-slate-900 transition-colors">
        
        {/* Mobile Header Navbar */}
        <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-slate-700 py-3 shadow-xs flex md:hidden items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Bachelor dot com logo" 
              className="w-8 h-8 rounded-full object-contain shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=B&background=4f46e5&color=fff&rounded=true';
              }}
            />
            <div>
              <h1 className="text-xs font-black text-slate-800 dark:text-white tracking-tight leading-none">ব্যাচেলর ডট কম</h1>
              <span className="text-[8px] text-blue-600 dark:text-blue-400 font-mono tracking-widest uppercase font-bold">Manager</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 border border-slate-200/80 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg cursor-pointer transition-all"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 border border-slate-200/80 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg cursor-pointer transition-all"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Desktop Title & Header Area */}
        <div className="max-w-4xl w-full mx-auto p-4 md:p-6 pb-0 flex-grow-0 hidden md:block mt-2">
          <header className="flex justify-between items-center mb-1">
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                {tabItems.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">রিয়েল-টাইম মেসের আধুনিক হিসাব খতিয়ান ও ডেটা ফিড</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-slate-350 rounded-xl shadow-xs transition-all cursor-pointer text-slate-500 dark:text-slate-300"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {/* Overlapping member circles */}
              <div className="flex -space-x-1.5">
                {members.filter(m => m.status === 'active').slice(0, 4).map((m, idx) => (
                  <div 
                    key={m.uid} 
                    className={`w-7 h-7 rounded-full border-2 border-slate-50 dark:border-slate-900 flex items-center justify-center font-bold text-[9px] shrink-0 text-white ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-emerald-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'}`} 
                    title={m.displayName}
                  >
                    {m.displayName?.charAt(0)}
                  </div>
                ))}
                {members.filter(m => m.status === 'active').length > 4 && (
                  <div className="w-7 h-7 rounded-full border-2 border-slate-50 bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600 shrink-0">
                    +{members.filter(m => m.status === 'active').length - 4}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab('notifications')}
                className="p-1.5 bg-white border border-slate-200 hover:border-slate-350 rounded-xl relative shadow-xs hover:shadow-md transition-all cursor-pointer text-slate-500"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                )}
              </button>
            </div>
          </header>
        </div>

        {/* Dynamic content view renderer */}
        <main className="max-w-4xl mx-auto w-full flex-grow p-4 md:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full font-sans"
            >
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'meals' && <MealManagerTab />}
              {activeTab === 'expenses' && <ExpenseTrackerTab />}
              {activeTab === 'deposits' && <DepositTab />}
              {activeTab === 'routines' && <RoutineTab />}
              {activeTab === 'members' && <MembersTab />}
              {activeTab === 'complaints' && <ComplaintsTab />}
              
              {activeTab === 'notifications' && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight">নোটিফিকেশন ও ঘোষণা লগ (Alert Archive)</h3>
                      <p className="text-[10px] text-slate-400">মেসে ঘটে যাওয়া সকল কার্যক্রমের রিয়েল-টাইম তথ্য এবং ইতিহাস</p>
                    </div>
                    {profile?.role === 'manager' && notifications.length > 0 && (
                      <button 
                        onClick={() => clearAllNotifications()}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map(notif => {
                        let typeColor = 'bg-slate-105 text-slate-600';
                        if (notif.type === 'expense') typeColor = 'bg-red-50 text-red-650 border border-red-100/50';
                        if (notif.type === 'deposit') typeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100/50';
                        if (notif.type === 'meal_request') typeColor = 'bg-blue-50 text-blue-700 border border-blue-105/50';

                        return (
                          <div key={notif.notificationId} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${typeColor}`}>
                              {notif.type === 'expense' ? 'বাজার' : notif.type === 'deposit' ? 'আমানত' : notif.type === 'meal_request' ? 'মিল' : 'মেসে'}
                            </span>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-850 leading-tight">{notif.title}</h4>
                              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{notif.message}</p>
                              <span className="text-[9px] text-slate-400 font-mono tracking-wider block">{new Date(notif.createdAt).toLocaleTimeString()} - {new Date(notif.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 bg-slate-50 border border-slate-150/40 rounded-2xl text-xs text-slate-400 font-semibold flex flex-col items-center justify-center">
                        <Bell className="w-8 h-8 text-slate-300 mb-1" />
                        আপাতত কোনো নোটিফিকেশন নেই।
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Bottom Navigator for Mobile Integration */}
        <div className="sticky bottom-0 z-45 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-slate-50/95 dark:via-slate-900/95 to-transparent pb-3.5 pt-1.5 px-4 w-full md:hidden">
          <nav className="max-w-xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl px-2 py-2.5 shadow-xl border border-slate-150 dark:border-slate-700 flex items-center justify-start gap-3 relative overflow-x-auto snap-x hide-scrollbar">
            {tabItems.map(item => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex flex-col items-center gap-1 px-4 min-w-16 py-1 rounded-xl transition-all snap-center relative cursor-pointer focus:outline-hidden ${isSelected ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className={`w-5 h-5 transition-transform ${isSelected ? 'scale-110 stroke-[2.2]' : 'scale-100'}`} />
                    {/* Realtime indicators badges */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white leading-none border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold leading-none tracking-tight">{item.label}</span>
                  
                  {isSelected && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 w-5 h-0.5 bg-blue-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Drawer Overlay backdrop for Settings */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 h-full max-w-sm w-full bg-white z-50 shadow-2xl p-6 flex flex-col justify-between"
            >
              <div className="space-y-6 font-sans">
                
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-extrabold text-slate-800 text-base">মেস সেটিংস ও তথ্য (Settings)</h3>
                  </div>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    বন্ধ করুন
                  </button>
                </div>

                {/* Profile snapshot information */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3.5">
                  <div className="text-xs uppercase font-mono tracking-widest text-slate-400">আমার ভূমিকা ও তথ্য</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">নাম:</span>
                      <strong className="text-slate-800">{profile?.displayName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ইমেইল:</span>
                      <strong className="text-slate-800 font-mono">{profile?.email}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">রোল / পদবী:</span>
                      <strong className="text-blue-605 uppercase font-bold">{profile?.role === 'manager' ? 'ম্যানেজার' : 'সদস্য'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">স্ট্যাটাস:</span>
                      <strong className="text-emerald-700 font-bold uppercase">{profile?.status}</strong>
                    </div>
                  </div>
                </div>

                {/* Mess configuration specs */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-155 space-y-3.5">
                  <div className="text-xs uppercase font-mono tracking-widest text-slate-400">মেস প্রোফাইল তথ্য</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">মেস নাম:</span>
                      <strong className="text-slate-800">{mess?.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">মেস আইডি:</span>
                      <strong className="text-slate-700 font-mono scrollbar-none max-w-[150px] truncate block text-right">{mess?.messId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ইনভাইট কোড:</span>
                      <strong className="text-blue-600 font-mono font-bold">{mess?.inviteCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">তৈরি ডেট:</span>
                      <strong className="text-slate-700 font-mono">{mess?.createdAt ? new Date(mess.createdAt).toLocaleDateString() : ''}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Leave or cancel buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleLeave}
                  className="w-full py-3.5 bg-red-50 border border-red-105 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> 
                  {profile?.role === 'manager' ? 'মেস প্রোফাইল ডিলিট করুন' : 'মেস গ্রুপ ত্যাগ করুন (Leave)'}
                </button>
                
                <button
                  onClick={signOut}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-semibold transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-500" /> লগ আউট করুন (Log Out)
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
