import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useApp, Recipe, RecipeIngredient } from '../../context/AppContext';

const Icon = (Comp: any, props: { size?: number; color?: string; style?: any }) => {
  const { color, ...rest } = props;
  return React.createElement(Comp, { stroke: color, color, ...rest });
};

const DAYS_CONFIG = [
  { key: 'sunday', label: 'יום ראשון' },
  { key: 'monday', label: 'יום שני' },
  { key: 'tuesday', label: 'יום שלישי' },
  { key: 'wednesday', label: 'יום רביעי' },
  { key: 'thursday', label: 'יום חמישי' },
  { key: 'friday', label: 'יום שישי' },
  { key: 'saturday', label: 'שבת' },
];

const BUILT_IN_RECIPES: Recipe[] = [
  {
    id: 'b1',
    title: 'שקשוקה ביתית עשירה',
    prepTime: '20 דקות',
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
    prepTime: '25 דקות',
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
    prepTime: '30 דקות',
    icon: '🥢',
    ingredients: [
      { name: 'חזה עוף', amount: 500, unit: 'g' },
      { name: 'אטריות נודלס', amount: 1, unit: 'pack' },
      { name: 'גזר', amount: 2, unit: 'units' },
      { name: 'קישוא', amount: 2, unit: 'units' },
      { name: 'סויה', amount: 1, unit: 'units' },
    ],
  },
];

export default function MealsScreen() {
  const {
    weeklyPlan,
    updateDayMeal,
    customRecipes,
    addCustomRecipe,
    deleteCustomRecipe,
    addMultipleShoppingItems,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'weekly' | 'recipes'>('weekly');

  const [editMealModal, setEditMealModal] = useState<{
    visible: boolean;
    dayKey: string;
    dayLabel: string;
    mealType: 'lunch' | 'dinner';
    currentVal: string;
  }>({
    visible: false,
    dayKey: '',
    dayLabel: '',
    mealType: 'lunch',
    currentVal: '',
  });
  const [mealInputText, setMealInputText] = useState('');

  const [ingredientModal, setIngredientModal] = useState<{
    visible: boolean;
    recipe: Recipe | null;
    selected: Record<string, boolean>;
  }>({
    visible: false,
    recipe: null,
    selected: {},
  });

  const [createRecipeModal, setCreateRecipeModal] = useState(false);
  const [newRecipeTitle, setNewRecipeTitle] = useState('');
  const [newRecipeTime, setNewRecipeTime] = useState('20 דקות');
  const [newRecipeIcon, setNewRecipeIcon] = useState('🍲');
  const [ingredientInputs, setIngredientInputs] = useState<RecipeIngredient[]>([
    { name: '', amount: 1, unit: 'units' },
  ]);

  const allRecipes = [...customRecipes, ...BUILT_IN_RECIPES];

  const handleOpenEditMeal = (dayKey: string, dayLabel: string, mealType: 'lunch' | 'dinner', currentVal: string) => {
    Haptics.selectionAsync();
    setMealInputText(currentVal);
    setEditMealModal({ visible: true, dayKey, dayLabel, mealType, currentVal });
  };

  const handleSaveMeal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateDayMeal(editMealModal.dayKey, editMealModal.mealType, mealInputText);
    setEditMealModal((prev) => ({ ...prev, visible: false }));
  };

  const handleOpenIngredients = (recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const initialSelected: Record<string, boolean> = {};
    recipe.ingredients.forEach((ing) => {
      initialSelected[ing.name] = true;
    });
    setIngredientModal({ visible: true, recipe, selected: initialSelected });
  };

  const handleToggleIngredient = (name: string) => {
    Haptics.selectionAsync();
    setIngredientModal((prev) => ({
      ...prev,
      selected: { ...prev.selected, [name]: !prev.selected[name] },
    }));
  };

  const handleTransferToCart = async () => {
    if (!ingredientModal.recipe) return;
    const itemsToAdd = ingredientModal.recipe.ingredients.filter(
      (ing) => ingredientModal.selected[ing.name]
    );

    if (itemsToAdd.length === 0) {
      Alert.alert('לא נבחרו מצרכים', 'אנא סמן לפחות מצרך אחד להוספה.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addMultipleShoppingItems(
      itemsToAdd.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
      }))
    );

    setIngredientModal({ visible: false, recipe: null, selected: {} });
    Alert.alert('נשלח לקניות! 🛒', `${itemsToAdd.length} מצרכים נוספו לסל הקניות המשותף.`);
  };

  const handleAddIngredientRow = () => {
    setIngredientInputs((prev) => [...prev, { name: '', amount: 1, unit: 'units' }]);
  };

  const handleUpdateIngredientRow = (index: number, field: keyof RecipeIngredient, value: any) => {
    setIngredientInputs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveCustomRecipe = async () => {
    if (!newRecipeTitle.trim()) {
      Alert.alert('שם מתכון חסר', 'נא להזין שם למנה.');
      return;
    }

    const validIngredients = ingredientInputs.filter((i) => i.name.trim().length > 0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await addCustomRecipe({
      title: newRecipeTitle.trim(),
      prepTime: newRecipeTime.trim() || '20 דקות',
      icon: newRecipeIcon || '🍳',
      ingredients: validIngredients,
    });

    setCreateRecipeModal(false);
    setNewRecipeTitle('');
    setIngredientInputs([{ name: '', amount: 1, unit: 'units' }]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'weekly' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('weekly');
            }}
          >
            {Icon(LucideIcons.CalendarDays, { size: 16, color: activeTab === 'weekly' ? '#FFF' : Colors.subtext })}
            <Text style={[styles.segmentText, activeTab === 'weekly' && styles.segmentTextActive]}>
              השבוע שלנו 🗓️
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'recipes' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('recipes');
            }}
          >
            {Icon(LucideIcons.BookOpen, { size: 16, color: activeTab === 'recipes' ? '#FFF' : Colors.subtext })}
            <Text style={[styles.segmentText, activeTab === 'recipes' && styles.segmentTextActive]}>
              ספר המתכונים ({allRecipes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'weekly' ? (
          <ScrollView contentContainerStyle={styles.scrollList}>
            {DAYS_CONFIG.map((day) => {
              const plan = weeklyPlan[day.key] || { lunch: 'לא נקבע', dinner: 'לא נקבע' };
              return (
                <View key={day.key} style={styles.card}>
                  <View style={styles.dayHeader}>
                    {Icon(LucideIcons.Sparkles, { size: 14, color: Colors.primary })}
                    <Text style={styles.dayTitle}>{day.label}</Text>
                  </View>

                  <View style={styles.mealsRow}>
                    <TouchableOpacity
                      style={styles.mealBox}
                      onPress={() => handleOpenEditMeal(day.key, day.label, 'lunch', plan.lunch)}
                    >
                      <View style={styles.mealBoxHeader}>
                        {Icon(LucideIcons.Sun, { size: 13, color: '#F59E0B' })}
                        <Text style={styles.mealLabel}>צהריים</Text>
                      </View>
                      <Text style={styles.mealText} numberOfLines={2}>{plan.lunch || 'לחץ להגדרה'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.mealBox}
                      onPress={() => handleOpenEditMeal(day.key, day.label, 'dinner', plan.dinner)}
                    >
                      <View style={styles.mealBoxHeader}>
                        {Icon(LucideIcons.Moon, { size: 13, color: '#8B5CF6' })}
                        <Text style={styles.mealLabel}>ערב</Text>
                      </View>
                      <Text style={styles.mealText} numberOfLines={2}>{plan.dinner || 'לחץ להגדרה'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <>
            <TouchableOpacity
              style={styles.addRecipeBannerBtn}
              onPress={() => setCreateRecipeModal(true)}
            >
              {Icon(LucideIcons.PlusCircle, { size: 18, color: '#FFF' })}
              <Text style={styles.addRecipeBannerText}>הוסף מתכון אישי חדש לספר 📖</Text>
            </TouchableOpacity>

            <FlatList
              data={allRecipes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.scrollList}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.recipeTopRow}>
                    {item.isCustom ? (
                      <TouchableOpacity
                        style={styles.deleteRecipeBtn}
                        onPress={() => deleteCustomRecipe(item.id)}
                      >
                        {Icon(LucideIcons.Trash2, { size: 16, color: Colors.textMuted })}
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.toCartButton}
                      onPress={() => handleOpenIngredients(item)}
                    >
                      {Icon(LucideIcons.ShoppingCart, { size: 14, color: '#FFF' })}
                      <Text style={styles.toCartButtonText}>מצרכים לסל</Text>
                    </TouchableOpacity>

                    <View style={styles.recipeTitleCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.recipeTitle}>{item.title}</Text>
                        <Text style={styles.recipeIcon}>{item.icon}</Text>
                      </View>
                      <View style={styles.timeBadge}>
                        {Icon(LucideIcons.Clock, { size: 11, color: Colors.subtext })}
                        <Text style={styles.timeText}>{item.prepTime}</Text>
                        {item.isCustom ? <Text style={styles.customBadge}>אישי</Text> : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.ingredientsSummaryRow}>
                    <Text style={styles.ingredientsSummaryText}>
                      מצרכים ({item.ingredients.length}): {item.ingredients.map((i) => i.name).join(', ')}
                    </Text>
                  </View>
                </View>
              )}
            />
          </>
        )}

        {/* מודאל עריכת ארוחה */}
        <Modal
          visible={editMealModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditMealModal((prev) => ({ ...prev, visible: false }))}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                עריכת {editMealModal.mealType === 'lunch' ? 'ארוחת צהריים' : 'ארוחת ערב'}
              </Text>
              <Text style={styles.modalSub}>{editMealModal.dayLabel}</Text>

              <TextInput
                style={styles.glassModalInput}
                value={mealInputText}
                onChangeText={setMealInputText}
                placeholder="למשל: סלמון בתנור / פיצה ביתית"
                placeholderTextColor={Colors.subtext}
                autoFocus
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditMealModal((prev) => ({ ...prev, visible: false }))}
                >
                  <Text style={styles.cancelBtnText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveMealBtn} onPress={handleSaveMeal}>
                  <Text style={styles.saveMealBtnText}>שמור בלוח</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* מודאל מצרכים לסל */}
        <Modal
          visible={ingredientModal.visible}
          transparent
          animationType="slide"
          onRequestClose={() => setIngredientModal({ visible: false, recipe: null, selected: {} })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>בחירת מצרכים לסל הקניות</Text>
              <Text style={[styles.modalSub, { color: Colors.primary }]}>{ingredientModal.recipe?.title}</Text>

              <ScrollView style={{ maxHeight: 260, marginVertical: 12 }}>
                {ingredientModal.recipe?.ingredients.map((ing, idx) => {
                  const isChecked = ingredientModal.selected[ing.name];
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.ingItemRow}
                      onPress={() => handleToggleIngredient(ing.name)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.ingAmount}>
                          {ing.amount} {ing.unit === 'units' ? 'יח׳' : ing.unit === 'kg' ? 'ק״ג' : ing.unit === 'g' ? 'גרם' : 'חבילה'}
                        </Text>
                        <Text style={styles.ingName}>{ing.name}</Text>
                      </View>
                      <View style={[styles.checkSquare, isChecked && styles.checkSquareActive]}>
                        {isChecked ? Icon(LucideIcons.Check, { size: 14, color: '#FFF' }) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIngredientModal({ visible: false, recipe: null, selected: {} })}
                >
                  <Text style={styles.cancelBtnText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.transferBtn} onPress={handleTransferToCart}>
                  <Text style={styles.transferBtnText}>הוסף לסל הקניות 🛒</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* מודאל הוספת מתכון */}
        <Modal
          visible={createRecipeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setCreateRecipeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>מתכון חדש לספר 🍳</Text>

              <TextInput
                style={styles.glassModalInput}
                placeholder="שם המתכון (למשל: פסטה בטטה ושמנת)"
                placeholderTextColor={Colors.subtext}
                value={newRecipeTitle}
                onChangeText={setNewRecipeTitle}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput
                  style={[styles.glassModalInput, { flex: 1 }]}
                  placeholder="זמן הכנה (למשל: 30 דקות)"
                  placeholderTextColor={Colors.subtext}
                  value={newRecipeTime}
                  onChangeText={setNewRecipeTime}
                />
                <TextInput
                  style={[styles.glassModalInput, { width: 70, textAlign: 'center' }]}
                  placeholder="אייקון"
                  placeholderTextColor={Colors.subtext}
                  value={newRecipeIcon}
                  onChangeText={setNewRecipeIcon}
                />
              </View>

              <View style={styles.ingSectionHeader}>
                <TouchableOpacity onPress={handleAddIngredientRow}>
                  <Text style={styles.addIngRowText}>+ הוסף שורת מצרך</Text>
                </TouchableOpacity>
                <Text style={styles.ingSectionTitle}>מצרכים נדרשים:</Text>
              </View>

              <ScrollView style={{ maxHeight: 180 }}>
                {ingredientInputs.map((row, idx) => (
                  <View key={idx} style={styles.newIngRow}>
                    <TextInput
                      style={[styles.glassModalInput, { flex: 2 }]}
                      placeholder="שם המצרך"
                      placeholderTextColor={Colors.subtext}
                      value={row.name}
                      onChangeText={(v) => handleUpdateIngredientRow(idx, 'name', v)}
                    />
                    <TextInput
                      style={[styles.glassModalInput, { width: 60, textAlign: 'center' }]}
                      placeholder="כמות"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.subtext}
                      value={row.amount.toString()}
                      onChangeText={(v) => handleUpdateIngredientRow(idx, 'amount', Number(v) || 1)}
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={[styles.modalBtnRow, { marginTop: 14 }]}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateRecipeModal(false)}>
                  <Text style={styles.cancelBtnText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveMealBtn} onPress={handleSaveCustomRecipe}>
                  <Text style={styles.saveMealBtnText}>שמור מתכון</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 6,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.subtext },
  segmentTextActive: { color: '#FFF' },
  scrollList: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 10 },
  dayTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  mealsRow: { flexDirection: 'row', gap: 10 },
  mealBox: {
    flex: 1,
    backgroundColor: Colors.glassInput,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-end',
  },
  mealBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  mealLabel: { fontSize: 11, fontWeight: '600', color: Colors.subtext },
  mealText: { fontSize: 13, color: Colors.text, textAlign: 'right', fontWeight: '500' },
  addRecipeBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addRecipeBannerText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  recipeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recipeTitleCol: { flex: 1, alignItems: 'flex-end' },
  recipeTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  recipeIcon: { fontSize: 18 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 11, color: Colors.subtext },
  customBadge: { fontSize: 10, color: Colors.primary, fontWeight: '700', backgroundColor: Colors.primaryMuted, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 4 },
  toCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  toCartButtonText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  deleteRecipeBtn: { padding: 4, marginRight: 4 },
  ingredientsSummaryRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ingredientsSummaryText: { fontSize: 11, color: Colors.subtext, textAlign: 'right' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#11131A',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, textAlign: 'right' },
  modalSub: { fontSize: 12, color: Colors.subtext, marginTop: 2, marginBottom: 14, textAlign: 'right' },
  glassModalInput: {
    height: 44,
    backgroundColor: Colors.glassInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    textAlign: 'right',
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  modalBtnRow: { flexDirection: 'row', gap: 8, width: '100%', marginTop: 10 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.glassInput },
  cancelBtnText: { color: Colors.subtext, fontWeight: '600', fontSize: 13 },
  saveMealBtn: { flex: 2, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.primary },
  saveMealBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  transferBtn: { flex: 2, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.secondary },
  transferBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  ingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ingName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  ingAmount: { fontSize: 12, color: Colors.subtext },
  checkSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glassInput,
  },
  checkSquareActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  ingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  ingSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  addIngRowText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  newIngRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
});