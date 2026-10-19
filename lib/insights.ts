// Monthly money summary and rule-based savings tips.
import type { Expense, ExpenseCategory, MemberId } from './types';
import { daysInMonth, monthKey, shiftMonth, todayISO } from './dates';
import { recommendStore, storeKey } from './prices';

export interface MonthSummary {
  month: string;
  total: number;
  count: number;
  byCategory: { category: ExpenseCategory; amount: number; share: number }[];
  byMember: Record<MemberId, number>;
}

export function summarizeMonth(expenses: Expense[], month: string): MonthSummary {
  const list = expenses.filter((e) => monthKey(e.date) === month);
  const total = list.reduce((s, e) => s + e.amount, 0);
  const cat = new Map<ExpenseCategory, number>();
  const byMember: Record<MemberId, number> = { a: 0, b: 0 };
  for (const e of list) {
    cat.set(e.category, (cat.get(e.category) || 0) + e.amount);
    byMember[e.paidBy] += e.amount;
  }
  const byCategory = Array.from(cat.entries())
    .map(([category, amount]) => ({ category, amount, share: total > 0 ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { month, total, count: list.length, byCategory, byMember };
}

/** Who should transfer how much so both paid the same this month. */
export function settleUp(byMember: Record<MemberId, number>): { from: MemberId; to: MemberId; amount: number } | null {
  const diff = byMember.a - byMember.b;
  if (Math.abs(diff) < 1) return null;
  return diff > 0 ? { from: 'b', to: 'a', amount: diff / 2 } : { from: 'a', to: 'b', amount: -diff / 2 };
}

export interface Tip {
  id: string;
  titleKey: string;
  bodyKey: string;
  params: Record<string, string | number>;
  saving?: number;
  tone: 'warn' | 'save' | 'info';
}

/**
 * Tips are deliberately concrete: each one names a number and, where possible,
 * the money that could be saved.
 */
export function savingsTips(expenses: Expense[], month: string, budget: number | null, shoppingNames: string[]): Tip[] {
  const tips: Tip[] = [];
  const cur = summarizeMonth(expenses, month);
  const prev = summarizeMonth(expenses, shiftMonth(month, -1));
  const isCurrent = month === monthKey(todayISO());
  const dayOfMonth = isCurrent ? Number(todayISO().slice(8, 10)) : daysInMonth(month);
  const dim = daysInMonth(month);

  // 1. Budget pace
  if (budget && budget > 0 && cur.total >= budget) {
    tips.push({ id: 'over', titleKey: 'tipOverTitle', bodyKey: 'tipOverBody', params: { over: Math.round(cur.total - budget) }, tone: 'warn' });
  } else if (budget && budget > 0 && isCurrent && cur.total > 0) {
    const projected = (cur.total / dayOfMonth) * dim;
    if (projected > budget * 1.02) {
      const left = Math.max(budget - cur.total, 0);
      const daysLeft = Math.max(dim - dayOfMonth, 1);
      tips.push({
        id: 'pace',
        titleKey: 'tipPaceTitle',
        bodyKey: 'tipPaceBody',
        params: { projected: Math.round(projected), over: Math.round(projected - budget), perDay: Math.round(left / daysLeft) },
        tone: 'warn',
      });
    }
  }

  // 2. Category spikes vs last month (compare at the same point of the month when current)
  const scale = isCurrent ? dayOfMonth / dim : 1;
  for (const c of cur.byCategory) {
    const before = (prev.byCategory.find((p) => p.category === c.category)?.amount || 0) * scale;
    if (before >= 50 && c.amount - before >= 100 && c.amount / before >= 1.25) {
      tips.push({
        id: `spike-${c.category}`,
        titleKey: 'tipSpikeTitle',
        bodyKey: 'tipSpikeBody',
        params: { category: c.category, pct: Math.round((c.amount / before - 1) * 100), extra: Math.round(c.amount - before) },
        saving: c.amount - before,
        tone: 'warn',
      });
    }
  }

  // 3. Eating out
  const dining = cur.byCategory.find((c) => c.category === 'dining');
  if (dining && dining.share >= 0.2 && dining.amount >= 200) {
    tips.push({
      id: 'dining',
      titleKey: 'tipDiningTitle',
      bodyKey: 'tipDiningBody',
      params: { pct: Math.round(dining.share * 100), saving: Math.round(dining.amount * 0.3) },
      saving: dining.amount * 0.3,
      tone: 'save',
    });
  }

  // 4. Cheaper supermarket
  const rec = recommendStore(expenses, shoppingNames);
  if (rec && rec.savingPct >= 0.04) {
    const atDearStore = expenses
      .filter((e) => monthKey(e.date) === month && e.category === 'groceries' && storeKey(e.store) === storeKey(rec.comparedTo))
      .reduce((s, e) => s + e.amount, 0);
    const monthly = atDearStore * rec.savingPct;
    tips.push({
      id: 'store',
      titleKey: 'tipStoreTitle',
      bodyKey: monthly >= 10 ? 'tipStoreBodyMonthly' : 'tipStoreBody',
      params: { best: rec.best, other: rec.comparedTo, pct: Math.round(rec.savingPct * 100), monthly: Math.round(monthly), items: rec.itemsCompared },
      saving: monthly,
      tone: 'save',
    });
  }

  // 5. Small purchases add up
  const small = expenses.filter((e) => monthKey(e.date) === month && e.amount > 0 && e.amount < 30);
  const smallSum = small.reduce((s, e) => s + e.amount, 0);
  if (small.length >= 8 && smallSum >= 150) {
    tips.push({
      id: 'small',
      titleKey: 'tipSmallTitle',
      bodyKey: 'tipSmallBody',
      params: { n: small.length, sum: Math.round(smallSum) },
      tone: 'info',
    });
  }

  // 6. Nothing to compare yet
  const withItems = expenses.filter((e) => e.items.length > 0 && e.store);
  const stores = new Set(withItems.map((e) => storeKey(e.store)));
  if (stores.size < 2) {
    tips.push({ id: 'more-receipts', titleKey: 'tipReceiptsTitle', bodyKey: 'tipReceiptsBody', params: {}, tone: 'info' });
  }

  const order = { warn: 0, save: 1, info: 2 };
  return tips.sort((a, b) => order[a.tone] - order[b.tone] || (b.saving || 0) - (a.saving || 0));
}
