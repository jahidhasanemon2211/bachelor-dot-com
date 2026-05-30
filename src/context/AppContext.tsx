/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut, 
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  UserProfile, 
  MessProfile, 
  MessMember, 
  MealRecord, 
  ExpenseRecord, 
  DepositRecord, 
  ShopperSchedule, 
  MessNotification,
  MessRoutine,
  ComplaintRecord,
  ShopperFundRecord
} from '../types';

interface AppContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  mess: MessProfile | null;
  members: MessMember[];
  meals: MealRecord[];
  expenses: ExpenseRecord[];
  deposits: DepositRecord[];
  schedules: ShopperSchedule[];
  notifications: MessNotification[];
  routines: MessRoutine[];
  complaints: ComplaintRecord[];
  shopperFunds: ShopperFundRecord[];
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createMess: (name: string, inviteCode: string) => Promise<void>;
  joinMess: (inviteCode: string) => Promise<{ success: boolean; message: string }>;
  leaveOrDeleteMess: () => Promise<void>;
  
  // Custom Mess Actions
  addExpense: (date: string, amount: number, items: { name: string; price: number }[], notes: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addDeposit: (date: string, amount: number) => Promise<void>;
  approveDeposit: (id: string) => Promise<void>;
  deleteDeposit: (id: string) => Promise<void>;
  updateMeal: (userId: string, userName: string, date: string, type: 'breakfast' | 'lunch' | 'dinner', value: number) => Promise<void>;
  requestMeals: (date: string, breakfast: number, lunch: number, dinner: number) => Promise<void>;
  addSchedule: (date: string, userId: string, userName: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  approveMember: (memberUid: string) => Promise<void>;
  removeMember: (memberUid: string) => Promise<void>;
  changeMemberRole: (memberUid: string, targetRole: 'manager' | 'accountant' | 'member') => Promise<void>;
  addRoutine: (dayOfWeek: string, breakfast: string, lunch: string, dinner: string) => Promise<void>;
  addComplaint: (title: string, description: string) => Promise<void>;
  updateComplaintStatus: (id: string, status: 'approved' | 'rejected', reply: string) => Promise<void>;
  deleteComplaint: (id: string) => Promise<void>;
  addShopperFund: (userId: string, userName: string, amount: number, type: 'advance' | 'return', date: string) => Promise<void>;
  deleteShopperFund: (id: string) => Promise<void>;
  sendNotification: (title: string, message: string, type: MessNotification['type']) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mess, setMess] = useState<MessProfile | null>(null);
  
  const [members, setMembers] = useState<MessMember[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [schedules, setSchedules] = useState<ShopperSchedule[]>([]);
  const [notifications, setNotifications] = useState<MessNotification[]>([]);
  const [routines, setRoutines] = useState<MessRoutine[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [shopperFunds, setShopperFunds] = useState<ShopperFundRecord[]>([]);
  
  const [loading, setLoading] = useState(true);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        // Fetch or create user profile
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || 'Anonymous Member',
              email: fbUser.email || '',
              messId: '',
              role: 'member',
              status: 'none',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      } else {
        setProfile(null);
        setMess(null);
        setMembers([]);
        setMeals([]);
        setExpenses([]);
        setDeposits([]);
        setSchedules([]);
        setNotifications([]);
        setRoutines([]);
        setComplaints([]);
        setShopperFunds([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Client-side state synchronizations based on active status changes
  const activeMessId = profile?.messId;
  const userRole = profile?.role;
  const userStatus = profile?.status;

  // Real-time Mess Listener & Children Collections
  useEffect(() => {
    if (!user || !activeMessId || userStatus === 'none') {
      setMess(null);
      setMembers([]);
      setMeals([]);
      setExpenses([]);
      setDeposits([]);
      setSchedules([]);
      setNotifications([]);
      setRoutines([]);
      setComplaints([]);
      setShopperFunds([]);
      return;
    }

    // Unsubscribe functions
    let unsubMess = () => {};
    let unsubMembers = () => {};
    let unsubMeals = () => {};
    let unsubExpenses = () => {};
    let unsubDeposits = () => {};
    let unsubSchedules = () => {};
    let unsubNotifications = () => {};
    let unsubRoutines = () => {};

    // Listen to Mess Record
    const messRef = doc(db, 'messes', activeMessId);
    unsubMess = onSnapshot(messRef, (snap) => {
      if (snap.exists()) {
        setMess(snap.data() as MessProfile);
      } else {
        setMess(null);
      }
    }, (err) => {
      console.error("Failed to sync mess record:", err);
    });

    // Listen to Members
    const membersRef = collection(db, 'messes', activeMessId, 'members');
    unsubMembers = onSnapshot(membersRef, (snap) => {
      const activeMembers: MessMember[] = [];
      snap.forEach((d) => {
        activeMembers.push(d.data() as MessMember);
      });
      setMembers(activeMembers);

      // Self status-approval-sync check
      const selfDocInSub = activeMembers.find(m => m.uid === user.uid);
      if (selfDocInSub) {
        // If my membership status is approved (active) in the sub-collection, but pending in my root user profile, sync it!
        if (selfDocInSub.status === 'active' && profile?.status !== 'active') {
          const userDocRef = doc(db, 'users', user.uid);
          updateDoc(userDocRef, { status: 'active', role: selfDocInSub.role })
            .then(() => {
              setProfile(prev => prev ? { ...prev, status: 'active', role: selfDocInSub.role } : null);
            })
            .catch(console.error);
        }
      }
    }, (err) => {
      console.error("Failed to sync mess members:", err);
    });

    // Listen to Meals
    const mealsRef = collection(db, 'messes', activeMessId, 'meals');
    unsubMeals = onSnapshot(mealsRef, (snap) => {
      const activeMeals: MealRecord[] = [];
      snap.forEach((d) => {
        activeMeals.push(d.data() as MealRecord);
      });
      setMeals(activeMeals);
    }, (err) => {
      console.error("Failed to sync meals:", err);
    });

    // Listen to Expenses
    const expensesRef = collection(db, 'messes', activeMessId, 'expenses');
    unsubExpenses = onSnapshot(expensesRef, (snap) => {
      const activeExpenses: ExpenseRecord[] = [];
      snap.forEach((d) => {
        activeExpenses.push(d.data() as ExpenseRecord);
      });
      // Sort by creation date descending
      activeExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(activeExpenses);
    }, (err) => {
      console.error("Failed to sync expenses:", err);
    });

    // Listen to Deposits
    const depositsRef = collection(db, 'messes', activeMessId, 'deposits');
    unsubDeposits = onSnapshot(depositsRef, (snap) => {
      const activeDeposits: DepositRecord[] = [];
      snap.forEach((d) => {
        activeDeposits.push(d.data() as DepositRecord);
      });
      activeDeposits.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDeposits(activeDeposits);
    }, (err) => {
      console.error("Failed to sync deposits:", err);
    });

    // Listen to Schedules
    const schedulesRef = collection(db, 'messes', activeMessId, 'schedules');
    unsubSchedules = onSnapshot(schedulesRef, (snap) => {
      const activeSchedules: ShopperSchedule[] = [];
      snap.forEach((d) => {
        activeSchedules.push(d.data() as ShopperSchedule);
      });
      setSchedules(activeSchedules);
    }, (err) => {
      console.error("Failed to sync schedules:", err);
    });

    // Listen to Notifications
    const notificationsRef = collection(db, 'messes', activeMessId, 'notifications');
    unsubNotifications = onSnapshot(notificationsRef, (snap) => {
      const activeNotifications: MessNotification[] = [];
      snap.forEach((d) => {
        activeNotifications.push(d.data() as MessNotification);
      });
      // Sort newest first
      activeNotifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(activeNotifications.slice(0, 30)); // Keep premium limit of 30 recent notifications
    }, (err) => {
      console.error("Failed to sync notifications:", err);
    });

    // Listen to Routines
    const routinesRef = collection(db, 'messes', activeMessId, 'routines');
    unsubRoutines = onSnapshot(routinesRef, (snap) => {
      const activeRoutines: MessRoutine[] = [];
      snap.forEach((d) => {
        activeRoutines.push(d.data() as MessRoutine);
      });
      setRoutines(activeRoutines);
    }, (err) => {
      console.error("Failed to sync routines:", err);
    });

    // Listen to Complaints
    const complaintsRef = collection(db, 'messes', activeMessId, 'complaints');
    const unsubComplaints = onSnapshot(complaintsRef, (snap) => {
      const activeComplaints: ComplaintRecord[] = [];
      snap.forEach((d) => {
        activeComplaints.push(d.data() as ComplaintRecord);
      });
      activeComplaints.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComplaints(activeComplaints);
    }, (err) => {
      console.error("Failed to sync complaints:", err);
    });

    // Listen to Shopper Funds
    const fundsRef = collection(db, 'messes', activeMessId, 'shopperFunds');
    const unsubFunds = onSnapshot(fundsRef, (snap) => {
      const activeFunds: ShopperFundRecord[] = [];
      snap.forEach((d) => {
        activeFunds.push(d.data() as ShopperFundRecord);
      });
      activeFunds.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setShopperFunds(activeFunds);
    }, (err) => {
      console.error("Failed to sync shopper funds:", err);
    });

    return () => {
      unsubMess();
      unsubMembers();
      unsubMeals();
      unsubExpenses();
      unsubDeposits();
      unsubSchedules();
      unsubNotifications();
      unsubRoutines();
      unsubComplaints();
      unsubFunds();
    };
  }, [user, activeMessId, userStatus]);

  // Auth helper operations
  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Failed to sign in:", err);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  // Mess management trigger operations
  const createMess = async (name: string, inviteCode: string) => {
    if (!user || !profile) return;
    const cleanInvite = inviteCode.trim().toLowerCase();
    const messId = 'mess_' + Math.floor(100000 + Math.random() * 900000);

    try {
      const pathForMess = `messes/${messId}`;
      const newMess: MessProfile = {
        messId,
        name,
        inviteCode: cleanInvite,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'messes', messId), newMess);

      const pathForMember = `messes/${messId}/members/${user.uid}`;
      const newMember: MessMember = {
        uid: user.uid,
        displayName: profile.displayName,
        email: profile.email,
        role: 'manager',
        status: 'active',
        joinedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'messes', messId, 'members', user.uid), newMember);

      // Update root user profile
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        messId,
        role: 'manager',
        status: 'active'
      });
      setProfile(prev => prev ? { ...prev, messId, role: 'manager', status: 'active' } : null);

      // Create a welcome notification
      await sendNotification(
        'স্মার্ট মেসে স্বাগতম!',
        `${profile.displayName} নতুন মেস "${name}" তৈরি করেছেন।`,
        'system'
      );

    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messes/${messId}`);
    }
  };

  const joinMess = async (inviteCode: string) => {
    if (!user || !profile) return { success: false, message: 'ব্যবহারকারী লগইন নেই।' };
    const cleanCode = inviteCode.trim().toLowerCase();

    try {
      // Find mess by invite code
      const messesQuery = query(collection(db, 'messes'), where('inviteCode', '==', cleanCode));
      const querySnap = await getDocs(messesQuery);

      if (querySnap.empty) {
        return { success: false, message: 'ভুল ইনভাইট কোড! দয়া করে সঠিক কোড দিন।' };
      }

      const messDoc = querySnap.docs[0];
      const messData = messDoc.data() as MessProfile;
      const targetMessId = messData.messId;

      // Check if already exist as member
      const memberDocRef = doc(db, 'messes', targetMessId, 'members', user.uid);
      const memberSnap = await getDoc(memberDocRef);

      if (memberSnap.exists()) {
        const memData = memberSnap.data() as MessMember;
        // User already has requested or is active
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          messId: targetMessId,
          role: memData.role,
          status: memData.status
        });
        setProfile(prev => prev ? { ...prev, messId: targetMessId, role: memData.role, status: memData.status } : null);
        return { success: true, message: 'আপনি অলরেডি এই মেসে সংযুক্ত আছেন।' };
      }

      // Create member request
      const newMember: MessMember = {
        uid: user.uid,
        displayName: profile.displayName,
        email: profile.email,
        role: 'member',
        status: 'pending',
        joinedAt: new Date().toISOString()
      };
      await setDoc(memberDocRef, newMember);

      // Update root user profile
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        messId: targetMessId,
        role: 'member',
        status: 'pending'
      });
      setProfile(prev => prev ? { ...prev, messId: targetMessId, role: 'member', status: 'pending' } : null);

      // Send join notification
      const notifId = 'notif_' + Math.floor(Math.random() * 10000000);
      await setDoc(doc(db, 'messes', targetMessId, 'notifications', notifId), {
        notificationId: notifId,
        title: 'নতুন মেম্বার রিকুয়েস্ট',
        message: `${profile.displayName} এই মেসে জয়েন করার জন্য রিকুয়েস্ট পাঠিয়েছেন।`,
        type: 'system',
        createdAt: new Date().toISOString()
      });

      return { success: true, message: 'জয়েন রিকুয়েস্ট সফলভাবে ম্যানেজারকে পাঠানো হয়েছে। মেস ম্যানেজার অ্যাপ্রুভ করলে ড্যাশবোর্ড চলে আসবে।' };

    } catch (err) {
      console.error(err);
      return { success: false, message: 'যোগদানে সমস্যা হয়েছে। আবার চেষ্টা করুন।' };
    }
  };

  const leaveOrDeleteMess = async () => {
    if (!user || !profile || !activeMessId) return;

    try {
      if (profile.role === 'manager') {
        // Manager deleting/leaving mess
        // For security and simplicity, we clear user fields so they can start fresh
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          messId: '',
          role: 'member',
          status: 'none'
        });
        
        // Remove member record as well
        await deleteDoc(doc(db, 'messes', activeMessId, 'members', user.uid));
        setProfile(prev => prev ? { ...prev, messId: '', role: 'member', status: 'none' } : null);
      } else {
        // General member leaving
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          messId: '',
          role: 'member',
          status: 'none'
        });
        await deleteDoc(doc(db, 'messes', activeMessId, 'members', user.uid));
        setProfile(prev => prev ? { ...prev, messId: '', role: 'member', status: 'none' } : null);
      }
    } catch (err) {
      console.error("Error leaving mess:", err);
    }
  };

  // Expense ADD
  const addExpense = async (date: string, amount: number, items: { name: string; price: number }[], notes: string) => {
    if (!profile?.messId) return;
    const messId = profile.messId;
    const expenseId = 'exp_' + Math.floor(Math.random() * 10000000);

    const data: ExpenseRecord = {
      expenseId,
      date,
      amount,
      shopperUid: user?.uid || '',
      shopperName: profile.displayName,
      items: JSON.stringify(items),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'messes', messId, 'expenses', expenseId), data);

      // Create notification for expense add
      const itemsString = items.map(i => `${i.name}: ${i.price}৳`).join(', ');
      await sendNotification(
        'নতুন বাজার খরচ যুক্ত হয়েছে',
        `${profile.displayName} ${amount}৳ খরচ যোগ করেছেন। (${itemsString})`,
        'expense'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messes/${messId}/expenses/${expenseId}`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!profile?.messId) return;
    try {
      await deleteDoc(doc(db, 'messes', profile.messId, 'expenses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messes/${profile.messId}/expenses/${id}`);
    }
  };

  // Deposit ADD
  const addDeposit = async (date: string, amount: number) => {
    if (!profile?.messId || !user) return;
    const messId = profile.messId;
    const depositId = 'dep_' + Math.floor(Math.random() * 10000000);

    const data: DepositRecord = {
      depositId,
      userId: user.uid,
      userName: profile.displayName,
      amount,
      date,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'messes', messId, 'deposits', depositId), data);

      // Notify manager
      await sendNotification(
        'ডিপোজিট রিকুয়েস্ট',
        `${profile.displayName} ${amount}৳ ডিপোজিট করার জন্য রিকুয়েস্ট করেছেন।`,
        'deposit'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messes/${messId}/deposits/${depositId}`);
    }
  };

  const approveDeposit = async (id: string) => {
    if (!profile?.messId || profile.role !== 'manager') return;
    try {
      const depositRef = doc(db, 'messes', profile.messId, 'deposits', id);
      const snap = await getDoc(depositRef);
      if (snap.exists()) {
        const depData = snap.data() as DepositRecord;
        await updateDoc(depositRef, {
          status: 'approved',
          approvedBy: user?.uid || ''
        });

        // Notify member
        await sendNotification(
          'ডিপোজিট অনুমোদন',
          `${depData.userName}-এর ${depData.amount}৳ ডিপোজিট রিকুয়েস্ট ম্যানেজার দ্বারা অনুমোদিত হয়েছে।`,
          'deposit'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messes/${profile.messId}/deposits/${id}`);
    }
  };

  const deleteDeposit = async (id: string) => {
    if (!profile?.messId) return;
    try {
      await deleteDoc(doc(db, 'messes', profile.messId, 'deposits', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messes/${profile.messId}/deposits/${id}`);
    }
  };

  // Meals Tracking Update
  const updateMeal = async (
    targetUserId: string, 
    targetUserName: string, 
    date: string, 
    type: 'breakfast' | 'lunch' | 'dinner', 
    value: number
  ) => {
    if (!profile?.messId) return;
    const messId = profile.messId;
    const mealId = `${targetUserId}_${date}`;

    try {
      const mealRef = doc(db, 'messes', messId, 'meals', mealId);
      const mealSnap = await getDoc(mealRef);

      if (mealSnap.exists()) {
        await updateDoc(mealRef, {
          [type]: value,
          updatedAt: new Date().toISOString()
        });
      } else {
        const emptyMeal: MealRecord = {
          mealId,
          userId: targetUserId,
          userName: targetUserName,
          date,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          reqBreakfast: 0,
          reqLunch: 0,
          reqDinner: 0,
          updatedAt: new Date().toISOString()
        };
        emptyMeal[type] = value;
        await setDoc(mealRef, emptyMeal);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messes/${messId}/meals/${mealId}`);
    }
  };

  // Next Day Meal Status Request by general member
  const requestMeals = async (date: string, breakfast: number, lunch: number, dinner: number) => {
    if (!profile?.messId || !user) return;
    const messId = profile.messId;
    const mealId = `${user.uid}_${date}`;

    try {
      const mealRef = doc(db, 'messes', messId, 'meals', mealId);
      const mealSnap = await getDoc(mealRef);

      if (mealSnap.exists()) {
        await updateDoc(mealRef, {
          reqBreakfast: breakfast,
          reqLunch: lunch,
          reqDinner: dinner,
          updatedAt: new Date().toISOString()
        });
      } else {
        const emptyMeal: MealRecord = {
          mealId,
          userId: user.uid,
          userName: profile.displayName,
          date,
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          reqBreakfast: breakfast,
          reqLunch: lunch,
          reqDinner: dinner,
          updatedAt: new Date().toISOString()
        };
        await setDoc(mealRef, emptyMeal);
      }

      // Format notification msg
      const summary = `সকাল: ${breakfast}, দুপুর: ${lunch}, রাত: ${dinner}`;
      await sendNotification(
        'মিল রিকুয়েস্ট আপডেট',
        `${profile.displayName} ${date} তারিখের জন্য মিল রিকুয়েস্ট আপডেট করেছেন: (${summary})`,
        'meal_request'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messes/${messId}/meals/${mealId}`);
    }
  };

  // Schedules (Calendar mapping who shops)
  const addSchedule = async (date: string, shopperUid: string, shopperName: string) => {
    if (!profile?.messId) return;
    const messId = profile.messId;
    const scheduleId = date; // composed of YYYY-MM-DD for single shopper per day max

    const data: ShopperSchedule = {
      scheduleId,
      date,
      userId: shopperUid,
      userName: shopperName
    };

    try {
      await setDoc(doc(db, 'messes', messId, 'schedules', scheduleId), data);

      // Notify members
      await sendNotification(
        'বাজারের নোটিশ',
        `আগামী ${date} তারিখে বাজারের দ্বায়িত্ব দেওয়া হয়েছে: ${shopperName}`,
        'system'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messes/${messId}/schedules/${scheduleId}`);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!profile?.messId) return;
    try {
      await deleteDoc(doc(db, 'messes', profile.messId, 'schedules', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messes/${profile.messId}/schedules/${id}`);
    }
  };

  // Approval on Join Request
  const approveMember = async (memberUid: string) => {
    if (!profile?.messId || profile.role !== 'manager') return;
    const messId = profile.messId;

    try {
      // 1. Get the member record
      const memberRef = doc(db, 'messes', messId, 'members', memberUid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const memData = memberSnap.data() as MessMember;

        // 2. Approve in the subcollection
        await updateDoc(memberRef, { status: 'active' });

        // Note: the general user's own login is self-healingly listening to their member doc and will auto-sync their root user document values to 'active' on their next login or active listener. However, we can also try to write directly for better feel!
        const userRef = doc(db, 'users', memberUid);
        await updateDoc(userRef, { status: 'active' });

        // Send confirmation feed broadcast
        await sendNotification(
          'নতুন মেসের সদস্য অনুমোদিত',
          `${memData.displayName} সফলভাবে মেসের সক্রিয় সদস্য হিসেবে অনুমোদিত হয়েছেন।`,
          'system'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messes/${messId}/members/${memberUid}`);
    }
  };

  const removeMember = async (memberUid: string) => {
    if (!profile?.messId || profile.role !== 'manager') return;
    const messId = profile.messId;

    try {
      await deleteDoc(doc(db, 'messes', messId, 'members', memberUid));
      // Reset user document if they are not active anymore
      const userRef = doc(db, 'users', memberUid);
      await updateDoc(userRef, {
        messId: '',
        role: 'member',
        status: 'none'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messes/${messId}/members/${memberUid}`);
    }
  };

  const changeMemberRole = async (memberUid: string, targetRole: 'manager' | 'accountant' | 'member') => {
    if (!profile?.messId || profile.role !== 'manager') return;
    const messId = profile.messId;

    try {
      const memberRef = doc(db, 'messes', messId, 'members', memberUid);
      await updateDoc(memberRef, { role: targetRole });

      const userRef = doc(db, 'users', memberUid);
      await updateDoc(userRef, { role: targetRole });
      
      const memberSnap = await getDoc(memberRef);
      if(memberSnap.exists()) {
        const memData = memberSnap.data() as MessMember;
        await sendNotification(
          'রোল পরিবর্তন',
          `${memData.displayName}-এর রোল পরিবর্তন করে ${targetRole} করা হয়েছে।`,
          'system'
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messes/${messId}/members/${memberUid}`);
    }
  };

  const addRoutine = async (dayOfWeek: string, breakfast: string, lunch: string, dinner: string) => {
    if (!profile?.messId || profile.role !== 'manager') return;
    const messId = profile.messId;
    const routineId = dayOfWeek; 

    try {
      const data: MessRoutine = {
        routineId,
        dayOfWeek,
        breakfast,
        lunch,
        dinner,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'messes', messId, 'routines', routineId), data);
      await sendNotification(
        'রুটিন আপডেট',
        `${dayOfWeek}-এর মিল রুটিন আপডেট করা হয়েছে।`,
        'system'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messes/${messId}/routines/${routineId}`);
    }
  };

  const addComplaint = async (title: string, description: string) => {
    if (!profile?.messId || !user) return;
    const messId = profile.messId;
    const complaintId = 'comp_' + Math.floor(Math.random() * 10000000);

    const data: ComplaintRecord = {
      complaintId,
      userId: user.uid,
      userName: profile.displayName,
      title,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'messes', messId, 'complaints', complaintId), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messes/${messId}/complaints/${complaintId}`);
    }
  };

  const updateComplaintStatus = async (id: string, status: 'approved' | 'rejected', reply: string) => {
    if (!profile?.messId || profile.role !== 'manager') return;
    try {
      const docRef = doc(db, 'messes', profile.messId, 'complaints', id);
      await updateDoc(docRef, {
        status,
        managerReply: reply,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messes/${profile.messId}/complaints/${id}`);
    }
  };

  const deleteComplaint = async (id: string) => {
    if (!profile?.messId) return;
    try {
      await deleteDoc(doc(db, 'messes', profile.messId, 'complaints', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messes/${profile.messId}/complaints/${id}`);
    }
  };

  const addShopperFund = async (userId: string, userName: string, amount: number, type: 'advance' | 'return', date: string) => {
    if (!profile?.messId || (profile.role !== 'manager' && profile.role !== 'accountant')) return;
    const messId = profile.messId;
    const fundId = 'fund_' + Math.floor(Math.random() * 10000000);

    const data: ShopperFundRecord = {
      fundId,
      userId,
      userName,
      amount,
      type,
      date,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'messes', messId, 'shopperFunds', fundId), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messes/${messId}/shopperFunds/${fundId}`);
    }
  };

  const deleteShopperFund = async (id: string) => {
    if (!profile?.messId || (profile.role !== 'manager' && profile.role !== 'accountant')) return;
    try {
      await deleteDoc(doc(db, 'messes', profile.messId, 'shopperFunds', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messes/${profile.messId}/shopperFunds/${id}`);
    }
  };

  // Internal notification helper
  const sendNotification = async (title: string, message: string, type: MessNotification['type']) => {
    if (!profile?.messId) return;
    const notificationId = 'notif_' + Math.floor(Math.random() * 10000000);
    const data: MessNotification = {
      notificationId,
      title,
      message,
      type,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'messes', profile.messId, 'notifications', notificationId), data);
    } catch (err) {
      console.error("Warning: Notification couldn't be logged:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!profile?.messId || profile.role !== 'manager') return;
    try {
      // we must delete sequentially or map because we only have client SDK here
      const proms = notifications.map(notif => 
        deleteDoc(doc(db, 'messes', profile.messId, 'notifications', notif.notificationId))
      );
      await Promise.all(proms);
      toast.success('সবগুলো বিজ্ঞপ্তি পরিষ্কার করা হয়েছে');
    } catch (err) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      profile,
      mess,
      members,
      meals,
      expenses,
      deposits,
      schedules,
      notifications,
      routines,
      complaints,
      shopperFunds,
      loading,
      signIn,
      signOut,
      createMess,
      joinMess,
      leaveOrDeleteMess,
      addExpense,
      deleteExpense,
      addDeposit,
      approveDeposit,
      deleteDeposit,
      updateMeal,
      requestMeals,
      addSchedule,
      deleteSchedule,
      approveMember,
      removeMember,
      changeMemberRole,
      addRoutine,
      addComplaint,
      updateComplaintStatus,
      deleteComplaint,
      addShopperFund,
      deleteShopperFund,
      sendNotification,
      clearAllNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
