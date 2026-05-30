/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from './context/AppContext';
import WelcomeView from './components/WelcomeView';
import ActiveMessView from './components/ActiveMessView';
import AuthView from './components/AuthView';
import { motion } from 'motion/react';

export default function App() {
  const { user, profile, loading } = useApp();

  // 1. Loading Spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-650 rounded-full mb-3"
        />
        <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
          স্মার্ট মেস ম্যানেজার লোড হচ্ছে
        </h3>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return <AuthView />;
  }

  // 3. Authenticated Onboarding / Status Decision-making router
  // If the user hasn't successfully established/joined a mess, or is still waiting for manager approval
  // Notice: if they used Email signup, they might theoretically already have a mess setup
  if (!profile?.messId || profile?.status !== 'active') {
    return <WelcomeView />;
  }

  // 4. Authenticated & Approved member/manager Dashboard Screen Tab
  return <ActiveMessView />;
}
