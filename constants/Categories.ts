export type CategoryKey = 'produce' | 'dairy' | 'meat' | 'bakery' | 'pantry' | 'household' | 'other';
export type UnitType = 'units' | 'kg' | 'g' | 'pack';

export const CATEGORY_ORDER: CategoryKey[] = ['produce', 'dairy', 'meat', 'bakery', 'pantry', 'household', 'other'];
export const UNITS: UnitType[] = ['units', 'kg', 'g', 'pack'];

export interface QuickFavorite {
  name: string;
  defaultAmount: number;
  defaultUnit: UnitType;
}

export const QUICK_FAVORITES: Record<'he' | 'ru' | 'en', QuickFavorite[]> = {
  he: [
    { name: 'חלב', defaultAmount: 1, defaultUnit: 'units' },
    { name: 'ביצים', defaultAmount: 1, defaultUnit: 'pack' },
    { name: 'עגבניות', defaultAmount: 1, defaultUnit: 'kg' },
    { name: 'מלפפונים', defaultAmount: 1, defaultUnit: 'kg' },
    { name: 'לחם', defaultAmount: 1, defaultUnit: 'units' },
    { name: 'גבינה צהובה', defaultAmount: 1, defaultUnit: 'pack' },
    { name: 'שמן זית', defaultAmount: 1, defaultUnit: 'units' },
  ],
  ru: [
    { name: 'Молоко', defaultAmount: 1, defaultUnit: 'units' },
    { name: 'Яйца', defaultAmount: 1, defaultUnit: 'pack' },
    { name: 'Помидоры', defaultAmount: 1, defaultUnit: 'kg' },
    { name: 'Огурцы', defaultAmount: 1, defaultUnit: 'kg' },
    { name: 'Хлеб', defaultAmount: 1, defaultUnit: 'units' },
    { name: 'Сыр', defaultAmount: 1, defaultUnit: 'pack' },
    { name: 'Оливковое масло', defaultAmount: 1, defaultUnit: 'units' },
  ],
  en: [
    { name: 'Milk', defaultAmount: 1, defaultUnit: 'units' },
    { name: 'Eggs', defaultAmount: 1, defaultUnit: 'pack' },
    { name: 'Tomatoes', defaultAmount: 1, defaultUnit: 'kg' },
    { name: 'Cucumbers', defaultAmount: 1, defaultUnit: 'kg' },
    { name: 'Bread', defaultAmount: 1, defaultUnit: 'units' },
    { name: 'Cheese', defaultAmount: 1, defaultUnit: 'pack' },
    { name: 'Olive oil', defaultAmount: 1, defaultUnit: 'units' },
  ],
};

const KEYWORDS: Record<Exclude<CategoryKey, 'other'>, string[]> = {
  dairy: ['חלב', 'ביצים', 'גבינ', 'חמאה', 'יוגורט', 'קוטג', 'שמנת', 'молок', 'яйц', 'сыр', 'масло слив', 'йогурт', 'творог', 'сметан', 'milk', 'egg', 'cheese', 'butter', 'yogurt', 'cream'],
  produce: ['עגבני', 'מלפפון', 'בצל', 'תפוח', 'בננה', 'חסה', 'לימון', 'גזר', 'פלפל', 'שום', 'помидор', 'огур', 'лук', 'яблок', 'банан', 'салат', 'лимон', 'морков', 'картоф', 'tomato', 'cucumber', 'onion', 'apple', 'banana', 'lettuce', 'lemon', 'carrot', 'potato', 'garlic'],
  meat: ['עוף', 'בקר', 'טחון', 'סטייק', 'סלמון', 'דג', 'טונה', 'שניצל', 'кури', 'говяд', 'фарш', 'стейк', 'лосос', 'рыб', 'тунец', 'chicken', 'beef', 'steak', 'salmon', 'fish', 'tuna', 'mince'],
  bakery: ['לחם', 'חלה', 'פיתות', 'לחמניות', 'בגט', 'קרואסון', 'טורטיות', 'хлеб', 'батон', 'булоч', 'лаваш', 'bread', 'bagel', 'baguette', 'croissant', 'pita', 'tortilla', 'bun'],
  pantry: ['אורז', 'פסטה', 'שמן', 'סוכר', 'מלח', 'קמח', 'שימורים', 'טחינה', 'קטשופ', 'рис', 'макарон', 'паста', 'масло', 'сахар', 'соль', 'мук', 'консерв', 'кетчуп', 'rice', 'pasta', 'oil', 'sugar', 'salt', 'flour', 'canned', 'ketchup', 'tahini'],
  household: ['סבון', 'שמפו', 'נייר טואלט', 'מגבונים', 'אקונומיקה', 'שקיות זבל', 'מדיח', 'мыло', 'шампун', 'туалетн', 'салфет', 'отбел', 'мусор', 'soap', 'shampoo', 'toilet', 'wipes', 'bleach', 'trash bag', 'detergent'],
};

export function autoCategorizeItem(name: string): CategoryKey {
  const n = name.trim().toLowerCase();
  for (const key of ['dairy', 'produce', 'meat', 'bakery', 'pantry', 'household'] as const) {
    if (KEYWORDS[key].some((k) => n.includes(k))) return key;
  }
  return 'other';
}
