export type CategoryKey = 'produce' | 'dairy' | 'meat' | 'bakery' | 'pantry' | 'household' | 'other';
export type UnitType = 'units' | 'kg' | 'g' | 'pack';

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  produce: { key: 'produce', label: 'פירות וירקות', icon: '🥦' },
  dairy: { key: 'dairy', label: 'מוצרי חלב וביצים', icon: '🧀' },
  meat: { key: 'meat', label: 'בשר ודגים', icon: '🥩' },
  bakery: { key: 'bakery', label: 'מאפים ולחמים', icon: '🥖' },
  pantry: { key: 'pantry', label: 'מזווה ויבשים', icon: '🥫' },
  household: { key: 'household', label: 'ניקיון ובית', icon: '🧼' },
  other: { key: 'other', label: 'שונות', icon: '📦' },
};

export const CATEGORIES_LIST: CategoryConfig[] = Object.values(CATEGORIES);

export interface QuickFavorite {
  name: string;
  defaultAmount: number;
  defaultUnit: UnitType;
}

export const QUICK_FAVORITES: QuickFavorite[] = [
  { name: 'חלב', defaultAmount: 1, defaultUnit: 'units' },
  { name: 'ביצים', defaultAmount: 1, defaultUnit: 'pack' },
  { name: 'עגבניות', defaultAmount: 1, defaultUnit: 'kg' },
  { name: 'מלפפונים', defaultAmount: 1, defaultUnit: 'kg' },
  { name: 'לחם', defaultAmount: 1, defaultUnit: 'units' },
  { name: 'גבינה צהובה', defaultAmount: 1, defaultUnit: 'pack' },
  { name: 'שמן זית', defaultAmount: 1, defaultUnit: 'units' },
];

export function autoCategorizeItem(name: string): CategoryKey {
  const n = name.trim().toLowerCase();
  if (['חלב', 'ביצים', 'גבינה', 'חמאה', 'יוגורט', 'קוטג', 'שמנת'].some((k) => n.includes(k))) return 'dairy';
  if (['עגבני', 'מלפפון', 'בצל', 'תפוח', 'בננה', 'חסה', 'לימון', 'גזר', 'תפוח אדמה'].some((k) => n.includes(k))) return 'produce';
  if (['עוף', 'בקר', 'טחון', 'סטייק', 'סלמון', 'דג', 'טונה', 'חזה עוף', 'שניצל'].some((k) => n.includes(k))) return 'meat';
  if (['לחם', 'חלה', 'פיתות', 'לחמניות', 'בגט', 'קוראסון', 'טורטיות'].some((k) => n.includes(k))) return 'bakery';
  if (['אורז', 'פסטה', 'שמן', 'סוכר', 'מלח', 'קמח', 'שימורים', 'טחינה', 'קטשופ'].some((k) => n.includes(k))) return 'pantry';
  if (['סבון', 'שמפו', 'נייר טואלט', 'מגבונים', 'אקונומיקה', 'שקיות זבל', 'מדיח'].some((k) => n.includes(k))) return 'household';
  return 'other';
}