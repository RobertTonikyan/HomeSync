// Price comparison built from the couple's own receipts.
import type { Expense } from './types';

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/["'״׳`.,()\-_/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function storeKey(s: string): string {
  return normalizeName(s);
}

interface Observation {
  item: string; // normalized item name from receipt
  label: string; // original receipt label
  store: string; // store key
  unitPrice: number;
  date: string;
}

export interface PriceBook {
  /** item -> store -> latest unit price */
  latest: Map<string, Map<string, { unitPrice: number; date: string; label: string }>>;
  storeNames: Map<string, string>; // store key -> display name
}

export function buildPriceBook(expenses: Expense[]): PriceBook {
  const obs: Observation[] = [];
  const storeNames = new Map<string, string>();
  for (const e of expenses) {
    if (!e.store || !e.items?.length) continue;
    const sk = storeKey(e.store);
    if (!sk) continue;
    if (!storeNames.has(sk)) storeNames.set(sk, e.store.trim());
    for (const line of e.items) {
      const qty = line.qty > 0 ? line.qty : 1;
      if (!line.name || !(line.price > 0)) continue;
      obs.push({ item: normalizeName(line.name), label: line.name.trim(), store: sk, unitPrice: line.price / qty, date: e.date });
    }
  }
  const latest: PriceBook['latest'] = new Map();
  for (const o of obs) {
    let byStore = latest.get(o.item);
    if (!byStore) {
      byStore = new Map();
      latest.set(o.item, byStore);
    }
    const prev = byStore.get(o.store);
    if (!prev || prev.date <= o.date) byStore.set(o.store, { unitPrice: o.unitPrice, date: o.date, label: o.label });
  }
  return { latest, storeNames };
}

/** Match a shopping-list name to a receipt item key ("חלב" matches "חלב 3% תנובה"). */
function findItemKey(book: PriceBook, wanted: string): string | null {
  const w = normalizeName(wanted);
  if (!w) return null;
  if (book.latest.has(w)) return w;
  let best: string | null = null;
  let bestStores = 0;
  for (const [key, stores] of book.latest) {
    const words = key.split(' ');
    const hit = words.includes(w) || key.startsWith(w + ' ') || w.split(' ').every((part) => words.includes(part));
    if (hit && stores.size > bestStores) {
      best = key;
      bestStores = stores.size;
    }
  }
  return best;
}

export interface ItemComparison {
  name: string;
  prices: { store: string; unitPrice: number }[]; // sorted cheapest first
}

export interface StoreRecommendation {
  best: string; // display name
  comparedTo: string; // display name of the next-best / usual store
  saving: number; // money saved on the compared items
  savingPct: number;
  itemsCompared: number;
  items: ItemComparison[];
  scope: 'list' | 'history';
}

/**
 * Recommend the cheapest store. Uses the shopping list when at least two of its items
 * have prices from two or more stores; otherwise uses the whole receipt history.
 */
export function recommendStore(expenses: Expense[], listNames: string[]): StoreRecommendation | null {
  const book = buildPriceBook(expenses);
  if (book.storeNames.size < 2) return null;

  const compareKeys = (keys: string[]) => {
    const multi = keys.filter((k) => (book.latest.get(k)?.size || 0) >= 2);
    return Array.from(new Set(multi));
  };

  let scope: 'list' | 'history' = 'list';
  let keys = compareKeys(listNames.map((n) => findItemKey(book, n)).filter((k): k is string => !!k));
  if (keys.length < 2) {
    scope = 'history';
    keys = compareKeys(Array.from(book.latest.keys()));
  }
  if (keys.length < 1) return null;

  // Pairwise comparison: for each store pair, sum prices over shared items.
  const stores = Array.from(book.storeNames.keys());
  let bestPair: { cheap: string; dear: string; saving: number; shared: string[]; dearTotal: number } | null = null;
  for (let i = 0; i < stores.length; i++) {
    for (let j = i + 1; j < stores.length; j++) {
      const s1 = stores[i];
      const s2 = stores[j];
      const shared = keys.filter((k) => book.latest.get(k)!.has(s1) && book.latest.get(k)!.has(s2));
      if (!shared.length) continue;
      const t1 = shared.reduce((sum, k) => sum + book.latest.get(k)!.get(s1)!.unitPrice, 0);
      const t2 = shared.reduce((sum, k) => sum + book.latest.get(k)!.get(s2)!.unitPrice, 0);
      const cheap = t1 <= t2 ? s1 : s2;
      const dear = t1 <= t2 ? s2 : s1;
      const saving = Math.abs(t1 - t2);
      const better =
        !bestPair ||
        shared.length > bestPair.shared.length ||
        (shared.length === bestPair.shared.length && saving > bestPair.saving);
      if (better) bestPair = { cheap, dear, saving, shared, dearTotal: Math.max(t1, t2) };
    }
  }
  if (!bestPair || bestPair.saving < 0.5) return null;

  const items: ItemComparison[] = bestPair.shared.map((k) => {
    const byStore = book.latest.get(k)!;
    const prices = Array.from(byStore.entries())
      .map(([s, v]) => ({ store: book.storeNames.get(s) || s, unitPrice: v.unitPrice }))
      .sort((a, b) => a.unitPrice - b.unitPrice);
    const label = byStore.values().next().value?.label || k;
    return { name: label, prices };
  });

  return {
    best: book.storeNames.get(bestPair.cheap) || bestPair.cheap,
    comparedTo: book.storeNames.get(bestPair.dear) || bestPair.dear,
    saving: bestPair.saving,
    savingPct: bestPair.dearTotal > 0 ? bestPair.saving / bestPair.dearTotal : 0,
    itemsCompared: bestPair.shared.length,
    items,
    scope,
  };
}

/** Distinct store names, most used first. */
export function knownStores(expenses: Expense[]): string[] {
  const counts = new Map<string, { name: string; n: number }>();
  for (const e of expenses) {
    if (!e.store) continue;
    const k = storeKey(e.store);
    const cur = counts.get(k);
    if (cur) cur.n++;
    else counts.set(k, { name: e.store.trim(), n: 1 });
  }
  return Array.from(counts.values())
    .sort((a, b) => b.n - a.n)
    .map((c) => c.name);
}
