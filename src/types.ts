/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  messId?: string;
  role?: 'manager' | 'accountant' | 'member';
  status?: 'active' | 'pending' | 'none';
  createdAt: string;
}

export interface MessProfile {
  messId: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export interface MessMember {
  uid: string;
  displayName: string;
  email: string;
  role: 'manager' | 'accountant' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

export interface MealRecord {
  mealId: string; // composed of userId_date
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  breakfast: number;
  lunch: number;
  dinner: number;
  reqBreakfast: number; // Requested meals for next day
  reqLunch: number;
  reqDinner: number;
  updatedAt: string;
}

export interface ExpenseItem {
  name: string;
  price: number;
}

export interface ExpenseRecord {
  expenseId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  shopperUid: string;
  shopperName: string;
  items: string; // Serialized list of ExpenseItem
  createdAt: string;
}

export interface DepositRecord {
  depositId: string;
  userId: string;
  userName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: 'pending' | 'approved';
  approvedBy?: string;
  createdAt: string;
}

export interface ShopperSchedule {
  scheduleId: string; // composed of YYYY-MM-DD
  date: string; // YYYY-MM-DD
  userId: string;
  userName: string;
}

export interface MessNotification {
  notificationId: string;
  title: string;
  message: string;
  type: 'expense' | 'system' | 'meal_request' | 'deposit';
  createdAt: string;
}

export interface MessRoutine {
  routineId: string; // 1 to 7 OR specific string
  dayOfWeek: string; // e.g., 'Saturday'
  breakfast: string;
  lunch: string;
  dinner: string;
  updatedAt: string;
}

export interface ComplaintRecord {
  complaintId: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  managerReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopperFundRecord {
  fundId: string;
  userId: string; // The person who received advance or returned
  userName: string;
  amount: number;
  type: 'advance' | 'return'; // advance = given to shopper, return = shopper giving back to mess
  date: string;
  createdAt: string;
}

