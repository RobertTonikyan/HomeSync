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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useApp, ShoppingItem } from '../../context/AppContext';
import {
  CATEGORIES_LIST,
  QUICK_FAVORITES,
  CategoryConfig,
  QuickFavorite,
  UnitType,
} from '../../constants/Categories';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const triggerSmoothAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};

const Icon = (Comp: any, props: { size?: number; color?: string; style?: any }) => {
  const { color, ...rest } = props;
  return React.createElement(Comp, { stroke: color, color, ...rest });
};

export default function ShoppingScreen() {
  const {
    shoppingItems,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCompletedShoppingItems,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('units');
  const [showCompleted, setShowCompleted] = useState(false);

  const activeItems = shoppingItems.filter((i) => !i.isCompleted);
  const completedItems = shoppingItems.filter((i) => i.isCompleted);

  const handleAddItem = async (name: string, amount: number = 1, unit?: UnitType) => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerSmoothAnimation();
    await addShoppingItem(name.trim(), amount, unit || selectedUnit);
    setInputText('');
  };

  const handleToggle = async (item: ShoppingItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    triggerSmoothAnimation();
    await toggleShoppingItem(item.id, item.isCompleted);
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    triggerSmoothAnimation();
    await deleteShoppingItem(id);
  };

  const handleClearCompleted = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    triggerSmoothAnimation();
    await clearCompletedShoppingItems();
  };

  const itemsByCategory = CATEGORIES_LIST.map((category: CategoryConfig) => ({
    ...category,
    items: activeItems.filter((item) => item.category === category.key),
  })).filter((cat) => cat.items.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>רשימת קניות 🛒</Text>
          <Text style={styles.headerSub}>
            {activeItems.length > 0 ? `${activeItems.length} פריטים נותרו לאיסוף` : 'הסל ריק ומוכן'}
          </Text>
        </View>

        <View style={styles.favoritesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favScroll}>
            {QUICK_FAVORITES.map((fav: QuickFavorite, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={styles.favChip}
                onPress={() => handleAddItem(fav.name, fav.defaultAmount, fav.defaultUnit)}
              >
                <Text style={styles.favChipText}>+ {fav.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.glassInputCard}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.addBtn, !inputText.trim() && styles.addBtnDisabled]}
              onPress={() => handleAddItem(inputText)}
              disabled={!inputText.trim()}
            >
              {Icon(LucideIcons.Plus, { size: 20, color: '#FFF' })}
            </TouchableOpacity>

            <TextInput
              style={styles.mainInput}
              placeholder="הוסף פריט (למשל: עגבניות, חלב, ביצים...)"
              placeholderTextColor={Colors.subtext}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleAddItem(inputText)}
              returnKeyType="done"
            />
          </View>

          <View style={styles.unitSelector}>
            {(['units', 'kg', 'g', 'pack'] as UnitType[]).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitChip, selectedUnit === u && styles.unitChipActive]}
                onPress={() => setSelectedUnit(u)}
              >
                <Text style={[styles.unitText, selectedUnit === u && styles.unitTextActive]}>
                  {u === 'units' ? 'יח׳' : u === 'kg' ? 'ק״ג' : u === 'g' ? 'גרם' : 'חבילה'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={itemsByCategory}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: category }) => (
            <View style={styles.categorySection}>
              <View style={styles.catHeaderRow}>
                <Text style={styles.catName}>{category.label}</Text>
                <Text style={styles.catIcon}>{category.icon}</Text>
              </View>

              {category.items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                    {Icon(LucideIcons.Trash2, { size: 16, color: Colors.textMuted })}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.itemTitleCol} onPress={() => handleToggle(item)}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.amount}{' '}
                      {item.unit === 'units' ? 'יח׳' : item.unit === 'kg' ? 'ק״ג' : item.unit === 'g' ? 'גרם' : 'חבילה'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.checkSquare} onPress={() => handleToggle(item)}>
                    {item.isCompleted ? Icon(LucideIcons.Check, { size: 14, color: '#FFF' }) : null}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          ListFooterComponent={
            completedItems.length > 0 ? (
              <View style={styles.completedSection}>
                <TouchableOpacity
                  style={styles.completedHeaderToggle}
                  onPress={() => {
                    Haptics.selectionAsync();
                    triggerSmoothAnimation();
                    setShowCompleted(!showCompleted);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={handleClearCompleted} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>מחק הכל</Text>
                    </TouchableOpacity>
                    {Icon(showCompleted ? LucideIcons.ChevronUp : LucideIcons.ChevronDown, {
                      size: 16,
                      color: Colors.subtext,
                    })}
                  </View>
                  <Text style={styles.completedHeaderTitle}>נאספו ({completedItems.length})</Text>
                </TouchableOpacity>

                {showCompleted &&
                  completedItems.map((item) => (
                    <View key={item.id} style={[styles.itemCard, styles.itemCardCompleted]}>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                        {Icon(LucideIcons.Trash2, { size: 16, color: Colors.textMuted })}
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.itemTitleCol} onPress={() => handleToggle(item)}>
                        <Text style={[styles.itemName, styles.itemNameCompleted]}>{item.name}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.checkSquare, styles.checkSquareActive]}
                        onPress={() => handleToggle(item)}
                      >
                        {Icon(LucideIcons.Check, { size: 14, color: '#FFF' })}
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>הכל מוכן ונקנה!</Text>
              <Text style={styles.emptySub}>הוסיפו מוצרים מתוך המועדפים או בהקלדה למעלה</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  favoritesWrapper: { paddingVertical: 10 },
  favScroll: { paddingHorizontal: 16, gap: 8 },
  favChip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  favChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  glassInputCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mainInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.glassInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    textAlign: 'right',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  unitSelector: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.glassInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  unitText: { fontSize: 11, color: Colors.subtext, fontWeight: '600' },
  unitTextActive: { color: Colors.primary, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  categorySection: { marginBottom: 18 },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  catName: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  catIcon: { fontSize: 14 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemCardCompleted: { opacity: 0.5 },
  itemTitleCol: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  itemNameCompleted: { textDecorationLine: 'line-through', color: Colors.subtext },
  itemMeta: { fontSize: 11, color: Colors.subtext, marginTop: 2 },
  checkSquare: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glassInput,
  },
  checkSquareActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deleteBtn: { padding: 4 },
  completedSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  completedHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  completedHeaderTitle: { fontSize: 13, fontWeight: '700', color: Colors.subtext },
  clearBtn: {
    backgroundColor: Colors.dangerMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clearBtnText: { fontSize: 11, color: Colors.danger, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.subtext, marginTop: 4 },
});