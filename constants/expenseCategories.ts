import { Car, HeartPulse, Home, Package, ShoppingCart, Ticket, Utensils, Zap } from 'lucide-react-native';
import type { ExpenseCategory } from '../lib/types';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['groceries', 'dining', 'home', 'bills', 'transport', 'fun', 'health', 'other'];

export const EXPENSE_ICONS: Record<ExpenseCategory, typeof Car> = {
  groceries: ShoppingCart,
  dining: Utensils,
  home: Home,
  bills: Zap,
  transport: Car,
  fun: Ticket,
  health: HeartPulse,
  other: Package,
};
