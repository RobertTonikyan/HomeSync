export type Language = 'he' | 'ru' | 'en';

export const TRANSLATIONS = {
  he: {
    // Tabs
    tabShopping: 'קניות',
    tabChores: 'מטלות',
    tabMeals: 'ארוחות',
    tabDates: 'דייטים',

    // Shopping
    shoppingTitle: 'רשימת קניות 🛒',
    shoppingRemaining: 'פריטים נותרו לאיסוף',
    shoppingEmpty: 'הסל ריק ומוכן',
    addItemPlaceholder: 'הוסף פריט (למשל: עגבניות, חלב...)',
    collected: 'נאספו',
    clearAll: 'מחק הכל',
    emptyShoppingTitle: 'הכל מוכן ונקנה!',
    emptyShoppingSub: 'הוסיפו מוצרים מתוך המועדפים או בהקלדה',

    // Chores & Calendar
    choresHeader: 'מטלות',
    calendarHeader: 'לוח שנה',
    allChores: 'הכל',
    myChores: 'המשימות שלי',
    partnerChores: 'של בת הזוג',
    addChorePlaceholder: 'מטלה חדשה (למשל: ריקון מדיח...)',
    addEventPlaceholder: 'אירוע חדש (למשל: סרט, בדיקה...)',
    eventDatePlaceholder: 'מועד / יום ושעה (למשל: חמישי ב-20:30)',
    emptyChoresTitle: 'הכל נקי ומסודר! 🧹',
    emptyChoresSub: 'אין מטלות פעילות כרגע',

    // Assignees
    assigneeMe: 'אני',
    assigneePartner: 'היא',
    assigneeBoth: 'שנינו',

    // Meals
    weeklyPlanTab: 'השבוע שלנו 🗓️',
    recipesTab: 'ספר המתכונים',
    lunch: 'צהריים',
    dinner: 'ערב',
    clickToSet: 'לחץ להגדרה',
    toCartBtn: 'מצרכים לסל',
    addRecipeBtn: 'הוסף מתכון אישי חדש לספר 📖',

    // Dates & Hub
    datesSubTab: 'דייטים ופינוקים ✨',
    hubSubTab: 'מרכז הבית ❤️',
    rouletteTitle: 'מתלבטים מה לעשות? 🎲',
    rouletteSub: 'הגרלה מהרשימה שלכם + רעיונות השראה מפתיעים',
    spinDateBtn: 'הגרל דייט!',
    addDatePlaceholder: 'רעיון לדייט או מסעדה (למשל: סושי, בר יין)',
    loveNoteTitle: 'פתק יומי משותף 💌',
    saveNote: 'שמור פתק לכולם',
    teamworkTitle: 'עבודת צוות בבית 🤝',
    teamworkActive: 'מטלות פעילות',
    teamworkCompleted: 'משימות שהושלמו',
    settingsTitle: 'הגדרות ושפה ⚙️',
    chooseLang: 'בחר שפה / Select Language',
  },
  ru: {
    // Tabs
    tabShopping: 'Покупки',
    tabChores: 'Дела',
    tabMeals: 'Еда',
    tabDates: 'Свидания',

    // Shopping
    shoppingTitle: 'Список покупок 🛒',
    shoppingRemaining: 'товаров осталось',
    shoppingEmpty: 'Корзина пуста',
    addItemPlaceholder: 'Добавить (напр. молоко, томаты...)',
    collected: 'Куплено',
    clearAll: 'Очистить',
    emptyShoppingTitle: 'Всё куплено!',
    emptyShoppingSub: 'Добавьте товары из избранного или строкой поиска',

    // Chores & Calendar
    choresHeader: 'Дела',
    calendarHeader: 'Календарь',
    allChores: 'Все',
    myChores: 'Мои дела',
    partnerChores: 'Партнёра',
    addChorePlaceholder: 'Новое дело (напр. посудомойка...)',
    addEventPlaceholder: 'Событие (напр. кино, врач...)',
    eventDatePlaceholder: 'Дата и время (напр. Чт в 20:30)',
    emptyChoresTitle: 'Дома чисто и уютно! 🧹',
    emptyChoresSub: 'Активных дел нет',

    // Assignees
    assigneeMe: 'Я',
    assigneePartner: 'Она',
    assigneeBoth: 'Мы',

    // Meals
    weeklyPlanTab: 'План на неделю 🗓️',
    recipesTab: 'Книга рецептов',
    lunch: 'Обед',
    dinner: 'Ужин',
    clickToSet: 'Нажмите для выбора',
    toCartBtn: 'В корзину',
    addRecipeBtn: 'Добавить свой рецепт 📖',

    // Dates & Hub
    datesSubTab: 'Свидания ✨',
    hubSubTab: 'Наш дом ❤️',
    rouletteTitle: 'Не знаете, чем заняться? 🎲',
    rouletteSub: 'Случайный выбор из ваших идей и вдохновения',
    spinDateBtn: 'Выбрать свидание!',
    addDatePlaceholder: 'Идея для свидания (напр. суши, вино)',
    loveNoteTitle: 'Общая записка дня 💌',
    saveNote: 'Сохранить записку',
    teamworkTitle: 'Командная работа 🤝',
    teamworkActive: 'активных дел',
    teamworkCompleted: 'завершено вместе',
    settingsTitle: 'Настройки и язык ⚙️',
    chooseLang: 'Выберите язык',
  },
  en: {
    // Tabs
    tabShopping: 'Shopping',
    tabChores: 'Chores',
    tabMeals: 'Meals',
    tabDates: 'Dates',

    // Shopping
    shoppingTitle: 'Shopping List 🛒',
    shoppingRemaining: 'items remaining',
    shoppingEmpty: 'Cart is empty',
    addItemPlaceholder: 'Add item (e.g., milk, eggs...)',
    collected: 'Collected',
    clearAll: 'Clear all',
    emptyShoppingTitle: 'All done & packed!',
    emptyShoppingSub: 'Add items from quick favorites or input above',

    // Chores & Calendar
    choresHeader: 'Chores',
    calendarHeader: 'Calendar',
    allChores: 'All',
    myChores: 'My tasks',
    partnerChores: 'Her tasks',
    addChorePlaceholder: 'New chore (e.g., dishwasher...)',
    addEventPlaceholder: 'New event (e.g., movie, appointment...)',
    eventDatePlaceholder: 'Date & time (e.g., Thu 8:30 PM)',
    emptyChoresTitle: 'Everything is spotless! 🧹',
    emptyChoresSub: 'No active chores right now',

    // Assignees
    assigneeMe: 'Me',
    assigneePartner: 'Her',
    assigneeBoth: 'Both',

    // Meals
    weeklyPlanTab: 'Weekly Plan 🗓️',
    recipesTab: 'Recipe Book',
    lunch: 'Lunch',
    dinner: 'Dinner',
    clickToSet: 'Tap to set',
    toCartBtn: 'Add to cart',
    addRecipeBtn: 'Add custom recipe 📖',

    // Dates & Hub
    datesSubTab: 'Dates & Treats ✨',
    hubSubTab: 'Home Hub ❤️',
    rouletteTitle: 'Wondering what to do? 🎲',
    rouletteSub: 'Random pick from your ideas & inspiration',
    spinDateBtn: 'Spin Date!',
    addDatePlaceholder: 'Date idea or restaurant (e.g., sushi, wine)',
    loveNoteTitle: 'Daily Love Note 💌',
    saveNote: 'Save note for both',
    teamworkTitle: 'Household Teamwork 🤝',
    teamworkActive: 'active tasks',
    teamworkCompleted: 'completed together',
    settingsTitle: 'Settings & Language ⚙️',
    chooseLang: 'Select Language',
  },
};