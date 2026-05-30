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
      <div className="loader-container bg-slate-50">
        <img src="/logo.png" alt="Bachelor Dot Com Logo" className="loader bg-white" />
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
