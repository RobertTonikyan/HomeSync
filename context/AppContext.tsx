import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, HOUSEHOLD_ID } from '../services/firebase';
import { autoCategorizeItem, CategoryKey, UnitType } from '../constants/Categories';
import { Language, TRANSLATIONS } from '../constants/translations';

export type RecurrenceType = 'once' | 'daily' | 'every_2_days' | 'weekly';
export type Assignee = 'me' | 'partner' | 'anyone';
export type DateCategory = 'food' | 'home' | 'outdoor';

export interface Chore {
  id: string;
  title: string;
  recurrence: RecurrenceType;
  assignedTo: Assignee;
  dueDate: string;
  isCompleted: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: CategoryKey;
  amount: number;
  unit: UnitType;
  isCompleted: boolean;
}

export interface DateIdea {
  id: string;
  title: string;
  category: DateCategory;
  note?: string;
  isCompleted: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  owner: Assignee;
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

interface AppContextType {
  // שפות (i18n)
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['he']) => string;

  // קניות
  shoppingItems: ShoppingItem[];
  isLoading: boolean;
  addShoppingItem: (name: string, amount?: number, unit?: UnitType, category?: CategoryKey) => Promise<void>;
  toggleShoppingItem: (id: string, currentCompletedStatus: boolean) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  clearCompletedShoppingItems: () => Promise<void>;
  addMultipleShoppingItems: (items: { name: string; amount?: number; unit?: UnitType }[]) => Promise<void>;

  // מטלות
  chores: Chore[];
  addChore: (title: string, recurrence: RecurrenceType, assignedTo: Assignee) => Promise<void>;
  toggleChore: (chore: Chore) => Promise<void>;
  updateChoreAssignee: (choreId: string, nextAssignee: Assignee) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;

  // לוח שנה
  events: CalendarEvent[];
  addEvent: (title: string, date: string, owner: Assignee) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // דייטים
  dateIdeas: DateIdea[];
  addDateIdea: (title: string, category: DateCategory, note?: string) => Promise<void>;
  toggleDateIdea: (id: string, currentCompleted: boolean) => Promise<void>;
  deleteDateIdea: (id: string) => Promise<void>;

  // פתק יומי
  dailyNote: string;
  updateDailyNote: (note: string) => Promise<void>;

  // ארוחות
  customRecipes: Recipe[];
  weeklyPlan: WeeklyPlan;
  addCustomRecipe: (recipe: Omit<Recipe, 'id' | 'isCustom'>) => Promise<void>;
  deleteCustomRecipe: (id: string) => Promise<void>;
  updateDayMeal: (dayKey: string, mealType: 'lunch' | 'dinner', mealName: string) => Promise<void>;
}

const DEFAULT_WEEKLY_PLAN: WeeklyPlan = {
  sunday: { lunch: 'חזה עוף ואורז', dinner: 'טוסטים וסלט ירקות' },
  monday: { lunch: 'שקשוקה ביתית', dinner: 'פסטה ברוטב עגבניות' },
  tuesday: { lunch: 'סלט קינואה ועוף', dinner: 'מרק כתום עשיר' },
  wednesday: { lunch: 'שניצל ופירה', dinner: 'מוקפץ ירקות וטופו' },
  thursday: { lunch: 'דג אפוי וירקות', dinner: 'פיצה ביתית' },
  friday: { lunch: 'שאריות קלות', dinner: 'ארוחת שישי חגיגית' },
  saturday: { lunch: 'ג׳חנון ביתי', dinner: 'סלט קליל וטוסט' },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('he');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dateIdeas, setDateIdeas] = useState<DateIdea[]>([]);
  const [dailyNote, setDailyNote] = useState('');
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(DEFAULT_WEEKLY_PLAN);
  const [isLoading, setIsLoading] = useState(true);

  const t = (key: keyof typeof TRANSLATIONS['he']) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['he'][key] || '';
  };

  // 1. קניות
  useEffect(() => {
    const qShopping = query(collection(db, 'shopping_items'), where('householdId', '==', HOUSEHOLD_ID));
    return onSnapshot(qShopping, (snapshot) => {
      setShoppingItems(
        snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          category: d.data().category,
          amount: d.data().amount ?? 1,
          unit: d.data().unit ?? 'units',
          isCompleted: d.data().isCompleted ?? false,
        }))
      );
      setIsLoading(false);
    });
  }, []);

  // 2. מטלות
  useEffect(() => {
    const qChores = query(collection(db, 'chores'), where('householdId', '==', HOUSEHOLD_ID));
    return onSnapshot(qChores, (snapshot) => {
      setChores(
        snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title,
          recurrence: d.data().recurrence ?? 'every_2_days',
          assignedTo: d.data().assignedTo ?? 'anyone',
          dueDate: d.data().dueDate ?? 'היום',
          isCompleted: d.data().isCompleted ?? false,
        }))
      );
    });
  }, []);

  // 3. לוח שנה
  useEffect(() => {
    const qEvents = query(collection(db, 'calendar_events'), where('householdId', '==', HOUSEHOLD_ID));
    return onSnapshot(qEvents, (snapshot) => {
      setEvents(
        snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title,
          date: d.data().date ?? '',
          owner: d.data().owner ?? 'anyone',
        }))
      );
    });
  }, []);

  // 4. דייטים
  useEffect(() => {
    const qDates = query(collection(db, 'date_ideas'), where('householdId', '==', HOUSEHOLD_ID));
    return onSnapshot(qDates, (snapshot) => {
      setDateIdeas(
        snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title,
          category: d.data().category ?? 'food',
          note: d.data().note ?? '',
          isCompleted: d.data().isCompleted ?? false,
        }))
      );
    });
  }, []);

  // 5. פתק יומי
  useEffect(() => {
    const qNotes = query(collection(db, 'house_notes'), where('householdId', '==', HOUSEHOLD_ID));
    return onSnapshot(qNotes, (snapshot) => {
      if (!snapshot.empty) {
        setDailyNote(snapshot.docs[0].data().content || '');
      }
    });
  }, []);

  // 6. מתכונים אישיים
  useEffect(() => {
    const qRecipes = query(collection(db, 'custom_recipes'), where('householdId', '==', HOUSEHOLD_ID));
    return onSnapshot(qRecipes, (snapshot) => {
      setCustomRecipes(
        snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title,
          prepTime: d.data().prepTime ?? '20 דקות',
          icon: d.data().icon ?? '🍳',
          ingredients: d.data().ingredients ?? [],
          isCustom: true,
        }))
      );
    });
  }, []);

  // 7. תכנון שבועי
  useEffect(() => {
    const planDocRef = doc(db, 'meal_plans', HOUSEHOLD_ID);
    return onSnapshot(planDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setWeeklyPlan((prev) => ({ ...prev, ...docSnap.data().plan }));
      }
    });
  }, []);

  // פעולות
  const addShoppingItem = async (name: string, amount: number = 1, unit: UnitType = 'units', category?: CategoryKey) => {
    await addDoc(collection(db, 'shopping_items'), {
      householdId: HOUSEHOLD_ID,
      name: name.trim(),
      category: category || autoCategorizeItem(name),
      amount,
      unit,
      isCompleted: false,
      createdAt: serverTimestamp(),
    });
  };

  const addMultipleShoppingItems = async (itemsToAdd: { name: string; amount?: number; unit?: UnitType }[]) => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'shopping_items');
    itemsToAdd.forEach((item) => {
      const newRef = doc(colRef);
      batch.set(newRef, {
        householdId: HOUSEHOLD_ID,
        name: item.name.trim(),
        category: autoCategorizeItem(item.name),
        amount: item.amount || 1,
        unit: item.unit || 'units',
        isCompleted: false,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  };

  const toggleShoppingItem = async (id: string, currentCompletedStatus: boolean) => {
    await updateDoc(doc(db, 'shopping_items', id), { isCompleted: !currentCompletedStatus });
  };

  const deleteShoppingItem = async (id: string) => {
    await deleteDoc(doc(db, 'shopping_items', id));
  };

  const clearCompletedShoppingItems = async () => {
    const batch = writeBatch(db);
    shoppingItems.filter((i) => i.isCompleted).forEach((item) => {
      batch.delete(doc(db, 'shopping_items', item.id));
    });
    await batch.commit();
  };

  const addChore = async (title: string, recurrence: RecurrenceType, assignedTo: Assignee) => {
    await addDoc(collection(db, 'chores'), {
      householdId: HOUSEHOLD_ID,
      title: title.trim(),
      recurrence,
      assignedTo,
      dueDate: recurrence === 'daily' ? 'כל יום' : 'היום',
      isCompleted: false,
      createdAt: serverTimestamp(),
    });
  };

  const toggleChore = async (chore: Chore) => {
    const choreRef = doc(db, 'chores', chore.id);
    if (chore.recurrence === 'once') {
      await updateDoc(choreRef, { isCompleted: !chore.isCompleted });
    } else {
      const nextDue = chore.recurrence === 'daily' ? 'מחר' : chore.recurrence === 'every_2_days' ? 'בעוד יומיים' : 'שבוע הבא';
      await updateDoc(choreRef, { dueDate: nextDue, isCompleted: false });
    }
  };

  const updateChoreAssignee = async (choreId: string, nextAssignee: Assignee) => {
    await updateDoc(doc(db, 'chores', choreId), { assignedTo: nextAssignee });
  };

  const deleteChore = async (choreId: string) => {
    await deleteDoc(doc(db, 'chores', choreId));
  };

  const addEvent = async (title: string, date: string, owner: Assignee) => {
    await addDoc(collection(db, 'calendar_events'), {
      householdId: HOUSEHOLD_ID,
      title: title.trim(),
      date: date.trim(),
      owner,
      createdAt: serverTimestamp(),
    });
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'calendar_events', id));
  };

  const addDateIdea = async (title: string, category: DateCategory, note?: string) => {
    await addDoc(collection(db, 'date_ideas'), {
      householdId: HOUSEHOLD_ID,
      title: title.trim(),
      category,
      note: note ? note.trim() : '',
      isCompleted: false,
      createdAt: serverTimestamp(),
    });
  };

  const toggleDateIdea = async (id: string, currentCompleted: boolean) => {
    await updateDoc(doc(db, 'date_ideas', id), { isCompleted: !currentCompleted });
  };

  const deleteDateIdea = async (id: string) => {
    await deleteDoc(doc(db, 'date_ideas', id));
  };

  const updateDailyNote = async (content: string) => {
    setDailyNote(content);
    await addDoc(collection(db, 'house_notes'), {
      householdId: HOUSEHOLD_ID,
      content,
      updatedAt: serverTimestamp(),
    });
  };

  const addCustomRecipe = async (recipe: Omit<Recipe, 'id' | 'isCustom'>) => {
    await addDoc(collection(db, 'custom_recipes'), {
      householdId: HOUSEHOLD_ID,
      title: recipe.title.trim(),
      prepTime: recipe.prepTime.trim(),
      icon: recipe.icon || '🍳',
      ingredients: recipe.ingredients,
      createdAt: serverTimestamp(),
    });
  };

  const deleteCustomRecipe = async (id: string) => {
    await deleteDoc(doc(db, 'custom_recipes', id));
  };

  const updateDayMeal = async (dayKey: string, mealType: 'lunch' | 'dinner', mealName: string) => {
    const updatedPlan = {
      ...weeklyPlan,
      [dayKey]: {
        ...weeklyPlan[dayKey],
        [mealType]: mealName.trim(),
      },
    };
    setWeeklyPlan(updatedPlan);

    const planDocRef = doc(db, 'meal_plans', HOUSEHOLD_ID);
    await setDoc(planDocRef, { householdId: HOUSEHOLD_ID, plan: updatedPlan }, { merge: true });
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        shoppingItems,
        isLoading,
        addShoppingItem,
        toggleShoppingItem,
        deleteShoppingItem,
        clearCompletedShoppingItems,
        addMultipleShoppingItems,
        chores,
        addChore,
        toggleChore,
        updateChoreAssignee,
        deleteChore,
        events,
        addEvent,
        deleteEvent,
        dateIdeas,
        addDateIdea,
        toggleDateIdea,
        deleteDateIdea,
        dailyNote,
        updateDailyNote,
        customRecipes,
        weeklyPlan,
        addCustomRecipe,
        deleteCustomRecipe,
        updateDayMeal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};