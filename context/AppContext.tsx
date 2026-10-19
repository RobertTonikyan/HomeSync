import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, ensureSignedIn, HOUSEHOLD_ID, joinHousehold } from '../services/firebase';
import { autoCategorizeItem, CategoryKey, UnitType } from '../constants/Categories';
import { Language, TKey, translate, isRTL } from '../constants/translations';
import { addDays, isISODate, todayISO } from '../lib/dates';
import {
  Assignee,
  CalendarEvent,
  Chore,
  ChoreLog,
  DateCategory,
  DateIdea,
  DayPlan,
  Effort,
  EFFORT_POINTS,
  Expense,
  ExpenseCategory,
  Household,
  MemberId,
  otherMember,
  Recipe,
  RECURRENCE_DAYS,
  RecurrenceType,
  RESCUE_BONUS_RATE,
  ShoppingItem,
  WeeklyPlan,
} from '../lib/types';

export * from '../lib/types';

// Layout direction is handled in JS (see lib/dir.ts) so switching language is instant.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

const STORAGE_LANG = 'homesync.lang';
const STORAGE_ME = 'homesync.me';

export type ExpenseInput = Omit<Expense, 'id' | 'hasPhoto'>;

interface AppContextType {
  ready: boolean;

  language: Language;
  rtl: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: TKey, params?: Record<string, string | number>) => string;

  me: MemberId | null;
  setMe: (m: MemberId) => void;
  household: Household;
  memberName: (m: MemberId) => string;
  updateMemberNames: (a: string, b: string) => Promise<void>;
  setMonthlyBudget: (amount: number | null) => Promise<void>;

  shoppingItems: ShoppingItem[];
  addShoppingItem: (name: string, amount?: number, unit?: UnitType, category?: CategoryKey) => Promise<void>;
  toggleShoppingItem: (id: string, currentCompletedStatus: boolean) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  clearCompletedShoppingItems: () => Promise<void>;
  addMultipleShoppingItems: (items: { name: string; amount?: number; unit?: UnitType }[]) => Promise<void>;

  chores: Chore[];
  choreLogs: ChoreLog[];
  addChore: (title: string, recurrence: RecurrenceType, assignedTo: Assignee, effort: Effort) => Promise<void>;
  completeChore: (chore: Chore, doneBy?: MemberId) => Promise<void>;
  undoChore: (chore: Chore) => Promise<void>;
  updateChoreAssignee: (choreId: string, nextAssignee: Assignee) => Promise<void>;
  deleteChore: (choreId: string) => Promise<void>;

  events: CalendarEvent[];
  addEvent: (title: string, date: string, owner: Assignee) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  dateIdeas: DateIdea[];
  addDateIdea: (title: string, category: DateCategory, note?: string) => Promise<void>;
  toggleDateIdea: (id: string, currentCompleted: boolean) => Promise<void>;
  deleteDateIdea: (id: string) => Promise<void>;

  dailyNote: string;
  updateDailyNote: (note: string) => Promise<void>;

  customRecipes: Recipe[];
  weeklyPlan: WeeklyPlan;
  addCustomRecipe: (recipe: Omit<Recipe, 'id' | 'isCustom'>) => Promise<void>;
  deleteCustomRecipe: (id: string) => Promise<void>;
  updateDayMeal: (dayKey: string, mealType: keyof DayPlan, mealName: string) => Promise<void>;

  expenses: Expense[];
  saveExpense: (input: ExpenseInput, opts: { id?: string; photoBase64?: string | null }) => Promise<string>;
  deleteExpense: (id: string) => Promise<void>;
  loadReceiptPhoto: (id: string) => Promise<string | null>;
}

const DEFAULT_HOUSEHOLD: Household = {
  members: { a: { name: '' }, b: { name: '' } },
  monthlyBudget: null,
};

const legacyAssignee = (v: unknown): Assignee => {
  if (v === 'a' || v === 'b' || v === 'anyone') return v;
  if (v === 'me') return 'a';
  if (v === 'partner') return 'b';
  return 'anyone';
};

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && isFinite(v) ? v : fallback);

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [language, setLanguageState] = useState<Language>('he');
  const [me, setMeState] = useState<MemberId | null>(null);
  const [household, setHousehold] = useState<Household>(DEFAULT_HOUSEHOLD);

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [choreLogs, setChoreLogs] = useState<ChoreLog[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dateIdeas, setDateIdeas] = useState<DateIdea[]>([]);
  const [dailyNote, setDailyNote] = useState('');
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Local preferences + anonymous sign-in
  useEffect(() => {
    (async () => {
      try {
        const [lang, who] = await Promise.all([AsyncStorage.getItem(STORAGE_LANG), AsyncStorage.getItem(STORAGE_ME)]);
        if (lang === 'he' || lang === 'ru' || lang === 'en') setLanguageState(lang);
        if (who === 'a' || who === 'b') setMeState(who);
      } catch {
        // storage unavailable — defaults are fine
      }
      setReady(true);
      await ensureSignedIn();
      await joinHousehold();
      setAuthed(true);
    })();
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_LANG, lang).catch(() => {});
  }, []);

  const setMe = useCallback((m: MemberId) => {
    setMeState(m);
    AsyncStorage.setItem(STORAGE_ME, m).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TKey, params?: Record<string, string | number>) => translate(language, key, params),
    [language]
  );

  const memberName = useCallback(
    (m: MemberId) => household.members[m]?.name || translate(language, m === 'a' ? 'memberFallbackA' : 'memberFallbackB'),
    [household, language]
  );

  // ---------- Firestore listeners ----------
  const byHousehold = (name: string) => query(collection(db, name), where('householdId', '==', HOUSEHOLD_ID));

  useEffect(() => {
    if (!authed) return;
    const unsubs: (() => void)[] = [];
    const warn = (what: string) => (e: unknown) => console.warn(`[firestore] ${what}`, e);

    unsubs.push(
      onSnapshot(
        doc(db, 'households', HOUSEHOLD_ID),
        (snap) => {
          const d = snap.data() || {};
          setHousehold({
            members: {
              a: { name: d.members?.a?.name || '' },
              b: { name: d.members?.b?.name || '' },
            },
            monthlyBudget: typeof d.monthlyBudget === 'number' ? d.monthlyBudget : null,
          });
        },
        warn('household')
      )
    );

    unsubs.push(
      onSnapshot(
        byHousehold('shopping_items'),
        (s) =>
          setShoppingItems(
            s.docs.map((d) => ({
              id: d.id,
              name: d.data().name || '',
              category: d.data().category || 'other',
              amount: num(d.data().amount, 1),
              unit: d.data().unit ?? 'units',
              isCompleted: !!d.data().isCompleted,
            }))
          ),
        warn('shopping')
      )
    );

    unsubs.push(
      onSnapshot(
        byHousehold('chores'),
        (s) =>
          setChores(
            s.docs
              .map((d) => {
                const x = d.data();
                return {
                  id: d.id,
                  title: x.title || '',
                  recurrence: (x.recurrence as RecurrenceType) ?? 'every_2_days',
                  assignedTo: legacyAssignee(x.assignedTo),
                  effort: (x.effort as Effort) || 'normal',
                  dueAt: isISODate(x.dueAt) ? x.dueAt : todayISO(),
                  isCompleted: !!x.isCompleted,
                  lastDoneBy: x.lastDoneBy,
                  lastDoneAt: x.lastDoneAt,
                } as Chore;
              })
              .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
          ),
        warn('chores')
      )
    );

    unsubs.push(
      onSnapshot(
        byHousehold('chore_logs'),
        (s) =>
          setChoreLogs(
            s.docs
              .map((d) => {
                const x = d.data();
                return {
                  id: d.id,
                  choreId: x.choreId || '',
                  title: x.title || '',
                  doneBy: x.doneBy === 'b' ? 'b' : 'a',
                  assignedTo: legacyAssignee(x.assignedTo),
                  points: num(x.points, 10),
                  bonus: num(x.bonus, 0),
                  day: isISODate(x.day) ? x.day : todayISO(),
                  createdAtMs: x.createdAt?.toMillis?.() ?? Date.now(),
                } as ChoreLog;
              })
              .sort((a, b) => b.createdAtMs - a.createdAtMs)
          ),
        warn('chore_logs')
      )
    );

    unsubs.push(
      onSnapshot(
        byHousehold('calendar_events'),
        (s) =>
          setEvents(
            s.docs.map((d) => ({
              id: d.id,
              title: d.data().title || '',
              date: d.data().date ?? '',
              owner: legacyAssignee(d.data().owner),
            }))
          ),
        warn('events')
      )
    );

    unsubs.push(
      onSnapshot(
        byHousehold('date_ideas'),
        (s) =>
          setDateIdeas(
            s.docs.map((d) => ({
              id: d.id,
              title: d.data().title || '',
              category: d.data().category ?? 'food',
              note: d.data().note ?? '',
              isCompleted: !!d.data().isCompleted,
            }))
          ),
        warn('date_ideas')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'house_notes', HOUSEHOLD_ID),
        (snap) => setDailyNote(snap.data()?.content || ''),
        warn('note')
      )
    );

    unsubs.push(
      onSnapshot(
        byHousehold('custom_recipes'),
        (s) =>
          setCustomRecipes(
            s.docs.map((d) => ({
              id: d.id,
              title: d.data().title || '',
              prepTime: d.data().prepTime ?? '',
              icon: d.data().icon ?? '🍳',
              ingredients: d.data().ingredients ?? [],
              isCustom: true,
            }))
          ),
        warn('recipes')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'meal_plans', HOUSEHOLD_ID),
        (snap) => {
          if (snap.exists()) setWeeklyPlan(snap.data().plan || {});
        },
        warn('meal_plans')
      )
    );

    unsubs.push(
      onSnapshot(
        byHousehold('expenses'),
        (s) =>
          setExpenses(
            s.docs
              .map((d) => {
                const x = d.data();
                return {
                  id: d.id,
                  amount: num(x.amount),
                  category: (x.category as ExpenseCategory) || 'other',
                  note: x.note || '',
                  store: x.store || '',
                  date: isISODate(x.date) ? x.date : todayISO(),
                  paidBy: x.paidBy === 'b' ? 'b' : 'a',
                  items: Array.isArray(x.items) ? x.items : [],
                  hasPhoto: !!x.hasPhoto,
                } as Expense;
              })
              .sort((a, b) => b.date.localeCompare(a.date))
          ),
        warn('expenses')
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [authed]);

  // ---------- Household ----------
  const updateMemberNames = async (a: string, b: string) => {
    await setDoc(
      doc(db, 'households', HOUSEHOLD_ID),
      { householdId: HOUSEHOLD_ID, members: { a: { name: a.trim() }, b: { name: b.trim() } } },
      { merge: true }
    );
  };

  const setMonthlyBudget = async (amount: number | null) => {
    await setDoc(doc(db, 'households', HOUSEHOLD_ID), { householdId: HOUSEHOLD_ID, monthlyBudget: amount }, { merge: true });
  };

  // ---------- Shopping ----------
  const addShoppingItem = async (name: string, amount = 1, unit: UnitType = 'units', category?: CategoryKey) => {
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
      batch.set(doc(colRef), {
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

  const toggleShoppingItem = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'shopping_items', id), { isCompleted: !current });
  };

  const deleteShoppingItem = async (id: string) => {
    await deleteDoc(doc(db, 'shopping_items', id));
  };

  const clearCompletedShoppingItems = async () => {
    const batch = writeBatch(db);
    shoppingItems.filter((i) => i.isCompleted).forEach((i) => batch.delete(doc(db, 'shopping_items', i.id)));
    await batch.commit();
  };

  // ---------- Chores ----------
  const addChore = async (title: string, recurrence: RecurrenceType, assignedTo: Assignee, effort: Effort) => {
    await addDoc(collection(db, 'chores'), {
      householdId: HOUSEHOLD_ID,
      title: title.trim(),
      recurrence,
      assignedTo,
      effort,
      dueAt: todayISO(),
      isCompleted: false,
      createdAt: serverTimestamp(),
    });
  };

  const completeChore = async (chore: Chore, doneBy?: MemberId) => {
    const who = doneBy || me || 'a';
    const today = todayISO();
    const points = EFFORT_POINTS[chore.effort] ?? 10;
    const isRescue = chore.assignedTo === otherMember(who);
    const bonus = isRescue ? Math.round(points * RESCUE_BONUS_RATE) : 0;

    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'chore_logs')), {
      householdId: HOUSEHOLD_ID,
      choreId: chore.id,
      title: chore.title,
      doneBy: who,
      assignedTo: chore.assignedTo,
      points,
      bonus,
      day: today,
      createdAt: serverTimestamp(),
    });
    const update: Record<string, unknown> = { lastDoneBy: who, lastDoneAt: today };
    if (chore.recurrence === 'once') {
      update.isCompleted = true;
    } else {
      // Next due date counts from today, or from the old due date if done early.
      const base = chore.dueAt > today ? chore.dueAt : today;
      update.dueAt = addDays(base, RECURRENCE_DAYS[chore.recurrence]);
      update.isCompleted = false;
    }
    batch.update(doc(db, 'chores', chore.id), update);
    await batch.commit();
  };

  const undoChore = async (chore: Chore) => {
    const last = choreLogs.find((l) => l.choreId === chore.id);
    const batch = writeBatch(db);
    if (last) batch.delete(doc(db, 'chore_logs', last.id));
    if (chore.recurrence === 'once') {
      batch.update(doc(db, 'chores', chore.id), { isCompleted: false });
    } else {
      const prevDue = addDays(chore.dueAt, -RECURRENCE_DAYS[chore.recurrence]);
      batch.update(doc(db, 'chores', chore.id), { dueAt: prevDue < todayISO() ? todayISO() : prevDue });
    }
    await batch.commit();
  };

  const updateChoreAssignee = async (choreId: string, nextAssignee: Assignee) => {
    await updateDoc(doc(db, 'chores', choreId), { assignedTo: nextAssignee });
  };

  const deleteChore = async (choreId: string) => {
    await deleteDoc(doc(db, 'chores', choreId));
  };

  // ---------- Calendar ----------
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

  // ---------- Dates ----------
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

  const toggleDateIdea = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'date_ideas', id), { isCompleted: !current });
  };

  const deleteDateIdea = async (id: string) => {
    await deleteDoc(doc(db, 'date_ideas', id));
  };

  // One shared note per household (previously a new document was added on every save).
  const updateDailyNote = async (content: string) => {
    setDailyNote(content);
    await setDoc(doc(db, 'house_notes', HOUSEHOLD_ID), {
      householdId: HOUSEHOLD_ID,
      content,
      updatedBy: me || 'a',
      updatedAt: serverTimestamp(),
    });
  };

  // ---------- Meals ----------
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

  const updateDayMeal = async (dayKey: string, mealType: keyof DayPlan, mealName: string) => {
    const updatedPlan: WeeklyPlan = {
      ...weeklyPlan,
      [dayKey]: { lunch: '', dinner: '', ...(weeklyPlan[dayKey] as Partial<DayPlan> | undefined), [mealType]: mealName.trim() },
    };
    setWeeklyPlan(updatedPlan);
    await setDoc(doc(db, 'meal_plans', HOUSEHOLD_ID), { householdId: HOUSEHOLD_ID, plan: updatedPlan }, { merge: true });
  };

  // ---------- Expenses & receipts ----------
  const saveExpense = async (input: ExpenseInput, opts: { id?: string; photoBase64?: string | null }) => {
    const ref = opts.id ? doc(db, 'expenses', opts.id) : doc(collection(db, 'expenses'));
    const payload: Record<string, unknown> = {
      householdId: HOUSEHOLD_ID,
      amount: Math.round(input.amount * 100) / 100,
      category: input.category,
      note: input.note.trim(),
      store: input.store.trim(),
      date: input.date,
      paidBy: input.paidBy,
      items: input.items
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), price: Math.round(i.price * 100) / 100, qty: i.qty > 0 ? i.qty : 1 })),
      updatedAt: serverTimestamp(),
    };
    if (opts.photoBase64) payload.hasPhoto = true;
    if (!opts.id) payload.createdAt = serverTimestamp();

    const batch = writeBatch(db);
    batch.set(ref, payload, { merge: true });
    if (opts.photoBase64) {
      // Photos live in their own collection so the expense list stays light.
      batch.set(doc(db, 'receipt_photos', ref.id), { householdId: HOUSEHOLD_ID, data: opts.photoBase64 });
    }
    await batch.commit();
    return ref.id;
  };

  const deleteExpense = async (id: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'expenses', id));
    if (expenses.find((e) => e.id === id)?.hasPhoto) batch.delete(doc(db, 'receipt_photos', id));
    await batch.commit();
  };

  const loadReceiptPhoto = async (id: string) => {
    try {
      const snap = await getDoc(doc(db, 'receipt_photos', id));
      const data = snap.data()?.data;
      return typeof data === 'string' ? data : null;
    } catch {
      return null;
    }
  };

  const value = useMemo<AppContextType>(
    () => ({
      ready,
      language,
      rtl: isRTL(language),
      setLanguage,
      t,
      me,
      setMe,
      household,
      memberName,
      updateMemberNames,
      setMonthlyBudget,
      shoppingItems,
      addShoppingItem,
      toggleShoppingItem,
      deleteShoppingItem,
      clearCompletedShoppingItems,
      addMultipleShoppingItems,
      chores,
      choreLogs,
      addChore,
      completeChore,
      undoChore,
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
      expenses,
      saveExpense,
      deleteExpense,
      loadReceiptPhoto,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, language, t, me, household, memberName, shoppingItems, chores, choreLogs, events, dateIdeas, dailyNote, customRecipes, weeklyPlan, expenses]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
