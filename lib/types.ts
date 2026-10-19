import type { CategoryKey, UnitType } from '../constants/Categories';

export type MemberId = 'a' | 'b';
export type Assignee = MemberId | 'anyone';
export type RecurrenceType = 'once' | 'daily' | 'every_2_days' | 'weekly';
export type Effort = 'light' | 'normal' | 'heavy';
export type DateCategory = 'food' | 'home' | 'outdoor';
export type ExpenseCategory = 'groceries' | 'dining' | 'home' | 'bills' | 'transport' | 'fun' | 'health' | 'other';

export interface Member {
  name: string;
}

export interface Household {
  members: Record<MemberId, Member>;
  monthlyBudget: number | null;
}

export interface Chore {
  id: string;
  title: string;
  recurrence: RecurrenceType;
  assignedTo: Assignee;
  effort: Effort;
  dueAt: string; // YYYY-MM-DD
  isCompleted: boolean; // only meaningful for one-time chores
  lastDoneBy?: MemberId;
  lastDoneAt?: string;
}

export interface ChoreLog {
  id: string;
  choreId: string;
  title: string;
  doneBy: MemberId;
  assignedTo: Assignee;
  points: number;
  bonus: number; // > 0 when someone did their partner's chore
  day: string; // YYYY-MM-DD
  createdAtMs: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: CategoryKey;
  amount: number;
  unit: UnitType;
  isCompleted: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  owner: Assignee;
}

export interface DateIdea {
  id: string;
  title: string;
  category: DateCategory;
  note?: string;
  isCompleted: boolean;
}

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: UnitType;
}

export interface Recipe {
  id: string;
  title: string;
  prepTime: string;
  icon: string;
  ingredients: RecipeIngredient[];
  isCustom?: boolean;
}

export interface DayPlan {
  lunch: string;
  dinner: string;
}

export type WeeklyPlan = Record<string, DayPlan>;

export interface ReceiptLine {
  name: string;
  price: number; // total paid for the line
  qty: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  store: string;
  date: string; // YYYY-MM-DD
  paidBy: MemberId;
  items: ReceiptLine[];
  hasPhoto: boolean;
}

export const EFFORT_POINTS: Record<Effort, number> = { light: 5, normal: 10, heavy: 20 };
export const RESCUE_BONUS_RATE = 0.5;
export const RECURRENCE_DAYS: Record<RecurrenceType, number> = { once: 0, daily: 1, every_2_days: 2, weekly: 7 };

export const otherMember = (m: MemberId): MemberId => (m === 'a' ? 'b' : 'a');
