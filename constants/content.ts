// Built-in content, localised. User-created content stays in the language it was written in.
import type { DateCategory, Recipe } from '../lib/types';
import type { Language } from './translations';

export const BUILT_IN_RECIPES: Record<Language, Recipe[]> = {
  he: [
    {
      id: 'b1',
      title: 'שקשוקה ביתית',
      prepTime: '20 דק׳',
      icon: '🍳',
      ingredients: [
        { name: 'עגבניות', amount: 4, unit: 'units' },
        { name: 'ביצים', amount: 4, unit: 'units' },
        { name: 'שום', amount: 3, unit: 'units' },
        { name: 'שמן זית', amount: 1, unit: 'units' },
        { name: 'חלה', amount: 1, unit: 'units' },
      ],
    },
    {
      id: 'b2',
      title: 'סלמון בתנור עם ירקות ירוקים',
      prepTime: '25 דק׳',
      icon: '🐟',
      ingredients: [
        { name: 'פילה סלמון', amount: 2, unit: 'units' },
        { name: 'ברוקולי', amount: 1, unit: 'units' },
        { name: 'שעועית ירוקה', amount: 1, unit: 'pack' },
        { name: 'לימון', amount: 2, unit: 'units' },
      ],
    },
    {
      id: 'b3',
      title: 'מוקפץ עוף ונודלס',
      prepTime: '30 דק׳',
      icon: '🥢',
      ingredients: [
        { name: 'חזה עוף', amount: 500, unit: 'g' },
        { name: 'אטריות', amount: 1, unit: 'pack' },
        { name: 'גזר', amount: 2, unit: 'units' },
        { name: 'קישוא', amount: 2, unit: 'units' },
        { name: 'רוטב סויה', amount: 1, unit: 'units' },
      ],
    },
  ],
  ru: [
    {
      id: 'b1',
      title: 'Домашняя шакшука',
      prepTime: '20 мин',
      icon: '🍳',
      ingredients: [
        { name: 'Помидоры', amount: 4, unit: 'units' },
        { name: 'Яйца', amount: 4, unit: 'units' },
        { name: 'Чеснок', amount: 3, unit: 'units' },
        { name: 'Оливковое масло', amount: 1, unit: 'units' },
        { name: 'Хала', amount: 1, unit: 'units' },
      ],
    },
    {
      id: 'b2',
      title: 'Запечённый лосось с зелёными овощами',
      prepTime: '25 мин',
      icon: '🐟',
      ingredients: [
        { name: 'Филе лосося', amount: 2, unit: 'units' },
        { name: 'Брокколи', amount: 1, unit: 'units' },
        { name: 'Стручковая фасоль', amount: 1, unit: 'pack' },
        { name: 'Лимон', amount: 2, unit: 'units' },
      ],
    },
    {
      id: 'b3',
      title: 'Курица с лапшой вок',
      prepTime: '30 мин',
      icon: '🥢',
      ingredients: [
        { name: 'Куриное филе', amount: 500, unit: 'g' },
        { name: 'Лапша', amount: 1, unit: 'pack' },
        { name: 'Морковь', amount: 2, unit: 'units' },
        { name: 'Кабачок', amount: 2, unit: 'units' },
        { name: 'Соевый соус', amount: 1, unit: 'units' },
      ],
    },
  ],
  en: [
    {
      id: 'b1',
      title: 'Homemade shakshuka',
      prepTime: '20 min',
      icon: '🍳',
      ingredients: [
        { name: 'Tomatoes', amount: 4, unit: 'units' },
        { name: 'Eggs', amount: 4, unit: 'units' },
        { name: 'Garlic', amount: 3, unit: 'units' },
        { name: 'Olive oil', amount: 1, unit: 'units' },
        { name: 'Challah', amount: 1, unit: 'units' },
      ],
    },
    {
      id: 'b2',
      title: 'Baked salmon with green vegetables',
      prepTime: '25 min',
      icon: '🐟',
      ingredients: [
        { name: 'Salmon fillet', amount: 2, unit: 'units' },
        { name: 'Broccoli', amount: 1, unit: 'units' },
        { name: 'Green beans', amount: 1, unit: 'pack' },
        { name: 'Lemon', amount: 2, unit: 'units' },
      ],
    },
    {
      id: 'b3',
      title: 'Chicken noodle stir-fry',
      prepTime: '30 min',
      icon: '🥢',
      ingredients: [
        { name: 'Chicken breast', amount: 500, unit: 'g' },
        { name: 'Noodles', amount: 1, unit: 'pack' },
        { name: 'Carrots', amount: 2, unit: 'units' },
        { name: 'Zucchini', amount: 2, unit: 'units' },
        { name: 'Soy sauce', amount: 1, unit: 'units' },
      ],
    },
  ],
};

export const BUILT_IN_DATE_IDEAS: Record<Language, { title: string; category: DateCategory; note: string }[]> = {
  he: [
    { title: 'פיקניק שקיעה בחוף', category: 'outdoor', note: 'יין, גבינות ומוזיקה' },
    { title: 'ערב קוקטיילים בבית', category: 'home', note: 'שייקר, קרח וממציאים משקה' },
    { title: 'טורניר משחקי קופסה', category: 'home', note: 'המפסיד מכין ארוחת בוקר' },
    { title: 'בר יין בעיר', category: 'food', note: 'כוס יין ונשנוש טוב' },
    { title: 'פיצה ביתית מהבצק', category: 'home', note: 'התפחה, רוטב טרי ותוספות' },
    { title: 'גלידה בלילה בטיילת', category: 'food', note: 'בלי תוכנית, רק לנסוע' },
    { title: 'מסלול הליכה קצר בטבע', category: 'outdoor', note: 'תרמוס קפה ונעלי ספורט' },
    { title: 'ערב ספא וסרט', category: 'home', note: 'נרות, מסכות פנים וסרט טוב' },
  ],
  ru: [
    { title: 'Пикник на закате у моря', category: 'outdoor', note: 'Вино, сыры и музыка' },
    { title: 'Вечер коктейлей дома', category: 'home', note: 'Шейкер, лёд и свой рецепт' },
    { title: 'Турнир настольных игр', category: 'home', note: 'Проигравший готовит завтрак' },
    { title: 'Винный бар в городе', category: 'food', note: 'Бокал вина и хорошая закуска' },
    { title: 'Пицца с нуля', category: 'home', note: 'Тесто, свежий соус, начинки' },
    { title: 'Ночное мороженое на набережной', category: 'food', note: 'Без плана, просто поехать' },
    { title: 'Короткий маршрут на природе', category: 'outdoor', note: 'Термос кофе и кроссовки' },
    { title: 'Спа-вечер и фильм', category: 'home', note: 'Свечи, маски и хорошее кино' },
  ],
  en: [
    { title: 'Sunset picnic at the beach', category: 'outdoor', note: 'Wine, cheese and music' },
    { title: 'Cocktail night at home', category: 'home', note: 'A shaker, ice and your own recipe' },
    { title: 'Board game tournament', category: 'home', note: 'Loser makes breakfast' },
    { title: 'Wine bar in town', category: 'food', note: 'A glass and a good bite' },
    { title: 'Pizza from scratch', category: 'home', note: 'Dough, fresh sauce, toppings' },
    { title: 'Late-night ice cream by the sea', category: 'food', note: 'No plan, just go' },
    { title: 'Short nature walk', category: 'outdoor', note: 'Thermos of coffee and sneakers' },
    { title: 'Spa night and a film', category: 'home', note: 'Candles, face masks, a good movie' },
  ],
};
