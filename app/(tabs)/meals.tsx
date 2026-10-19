import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Clock, Moon, Plus, ShoppingBasket, Sun, Trash2 } from 'lucide-react-native';
import { C, R, S } from '../../constants/theme';
import { UNITS } from '../../constants/Categories';
import { BUILT_IN_RECIPES } from '../../constants/content';
import { useApp } from '../../context/AppContext';
import type { DayPlan, Recipe, RecipeIngredient } from '../../lib/types';
import {
  Button,
  Card,
  CheckCircle,
  Chip,
  ChipRow,
  Field,
  IconButton,
  List,
  ListRow,
  ProfileButton,
  Row,
  Screen,
  Section,
  Segmented,
  Sheet,
  T,
  inset,
  success,
  useDir,
} from '../../components/ui';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const ICONS = ['🍲', '🥗', '🍝', '🍳', '🐟', '🥩', '🌮', '🍕'];

export default function MealsScreen() {
  const { t, language, weeklyPlan, updateDayMeal, customRecipes, addCustomRecipe, deleteCustomRecipe, addMultipleShoppingItems } = useApp();
  const d = useDir();
  const [tab, setTab] = useState<'week' | 'recipes'>('week');
  const [edit, setEdit] = useState<{ day: string; meal: keyof DayPlan } | null>(null);
  const [mealText, setMealText] = useState('');
  const [picker, setPicker] = useState<{ recipe: Recipe; selected: Record<number, boolean> } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newIcon, setNewIcon] = useState(ICONS[0]);
  const [newIngredients, setNewIngredients] = useState<RecipeIngredient[]>([{ name: '', amount: 1, unit: 'units' }]);

  const recipes = [...customRecipes, ...BUILT_IN_RECIPES[language]];
  const todayIdx = new Date().getDay();
  const unitLabel = (u: string) => t(`unit_${u}` as any);

  const openEdit = (day: string, meal: keyof DayPlan) => {
    setMealText(weeklyPlan[day]?.[meal] || '');
    setEdit({ day, meal });
  };

  const transfer = async () => {
    if (!picker) return;
    const items = picker.recipe.ingredients.filter((_, i) => picker.selected[i]);
    if (!items.length) return;
    await addMultipleShoppingItems(items.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit })));
    success();
    setPicker(null);
    Alert.alert(t('addedToList', { n: items.length }));
  };

  const saveRecipe = async () => {
    if (!newTitle.trim()) return;
    await addCustomRecipe({
      title: newTitle,
      prepTime: newTime,
      icon: newIcon,
      ingredients: newIngredients.filter((i) => i.name.trim()),
    });
    success();
    setCreating(false);
    setNewTitle('');
    setNewTime('');
    setNewIngredients([{ name: '', amount: 1, unit: 'units' }]);
  };

  return (
    <Screen title={t('tabMeals')} right={<ProfileButton />}>
      <Segmented
        style={[inset, { marginTop: S.md }]}
        value={tab}
        onChange={setTab}
        options={[
          { key: 'week', label: t('thisWeek') },
          { key: 'recipes', label: `${t('recipes')} · ${recipes.length}` },
        ]}
      />

      {tab === 'week' ? (
        <View style={{ marginTop: S.lg, gap: S.sm }}>
          {DAYS.map((day, idx) => {
            const plan = weeklyPlan[day] || { lunch: '', dinner: '' };
            const isToday = idx === todayIdx;
            return (
              <Card key={day} style={[{ paddingVertical: S.md }, isToday && { borderColor: C.accent }]}>
                <Row style={{ justifyContent: 'space-between', marginBottom: S.sm }}>
                  <T v="bodyStrong" color={isToday ? C.accent : C.text}>
                    {t(`day_${day}` as any)}
                  </T>
                  {isToday ? (
                    <T v="label" color={C.accent}>
                      {t('today').toUpperCase()}
                    </T>
                  ) : null}
                </Row>
                <View style={{ flexDirection: d.row, gap: S.sm }}>
                  {(['lunch', 'dinner'] as (keyof DayPlan)[]).map((meal) => (
                    <Pressable key={meal} onPress={() => openEdit(day, meal)} style={styles.mealBox}>
                      <Row gap={6}>
                        {meal === 'lunch' ? <Sun size={13} color={C.textMuted} /> : <Moon size={13} color={C.textMuted} />}
                        <T v="small" color={C.textMuted}>
                          {t(meal)}
                        </T>
                      </Row>
                      <T v="body" color={plan[meal] ? C.text : C.textFaint} numberOfLines={2}>
                        {plan[meal] || t('tapToPlan')}
                      </T>
                    </Pressable>
                  ))}
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <>
          <View style={[inset, { marginTop: S.lg }]}>
            <Button kind="secondary" label={t('newRecipe')} icon={<Plus size={18} color={C.text} />} onPress={() => setCreating(true)} />
          </View>
          <Section>
            <List>
              {recipes.map((r) => (
                <ListRow
                  key={r.id}
                  title={r.title}
                  subtitle={
                    <Row gap={6} style={{ marginTop: 2 }}>
                      {r.prepTime ? (
                        <>
                          <Clock size={12} color={C.textMuted} />
                          <T v="small" color={C.textMuted}>
                            {r.prepTime}
                          </T>
                          <T v="small" color={C.textFaint}>
                            ·
                          </T>
                        </>
                      ) : null}
                      <T v="small" color={C.textMuted}>
                        {t('ingredientsN', { n: r.ingredients.length })}
                      </T>
                      {r.isCustom ? (
                        <T v="small" color={C.accent}>
                          · {t('yours')}
                        </T>
                      ) : null}
                    </Row>
                  }
                  leading={<T v="title">{r.icon}</T>}
                  onPress={() => {
                    const selected: Record<number, boolean> = {};
                    r.ingredients.forEach((_, i) => (selected[i] = true));
                    setPicker({ recipe: r, selected });
                  }}
                  trailing={
                    <Row gap={2}>
                      <ShoppingBasket size={18} color={C.textMuted} />
                      {r.isCustom ? (
                        <IconButton
                          onPress={() =>
                            Alert.alert(t('deleteRecipeQ'), r.title, [
                              { text: t('cancel'), style: 'cancel' },
                              { text: t('delete'), style: 'destructive', onPress: () => deleteCustomRecipe(r.id) },
                            ])
                          }
                        >
                          <Trash2 size={16} color={C.textFaint} />
                        </IconButton>
                      ) : null}
                    </Row>
                  }
                />
              ))}
            </List>
          </Section>
        </>
      )}

      {/* Edit a meal */}
      <Sheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `${t(`day_${edit.day}` as any)} · ${t(edit.meal)}` : ''}
      >
        <View style={{ gap: S.md }}>
          <Field value={mealText} onChangeText={setMealText} placeholder={t('mealPlaceholder')} autoFocus />
          <ChipRow>
            {recipes.slice(0, 6).map((r) => (
              <Chip key={r.id} label={`${r.icon} ${r.title}`} onPress={() => setMealText(r.title)} />
            ))}
          </ChipRow>
          <Button
            label={t('save')}
            onPress={async () => {
              if (edit) await updateDayMeal(edit.day, edit.meal, mealText);
              setEdit(null);
            }}
          />
        </View>
      </Sheet>

      {/* Ingredients to list */}
      <Sheet visible={!!picker} onClose={() => setPicker(null)} title={picker?.recipe.title || ''}>
        {picker ? (
          <View style={{ gap: S.md }}>
            <T v="small" color={C.textMuted}>
              {t('pickIngredients')}
            </T>
            <View style={{ borderRadius: R.md, borderWidth: StyleSheet.hairlineWidth, borderColor: C.hairline, overflow: 'hidden' }}>
              {picker.recipe.ingredients.map((ing, i) => (
                <ListRow
                  key={i}
                  title={ing.name}
                  subtitle={`${ing.amount} ${unitLabel(ing.unit)}`}
                  onPress={() => setPicker({ ...picker, selected: { ...picker.selected, [i]: !picker.selected[i] } })}
                  leading={
                    <CheckCircle
                      checked={!!picker.selected[i]}
                      onPress={() => setPicker({ ...picker, selected: { ...picker.selected, [i]: !picker.selected[i] } })}
                    />
                  }
                />
              ))}
            </View>
            <Button label={t('addToList')} icon={<ShoppingBasket size={18} color={C.onAccent} />} onPress={transfer} />
          </View>
        ) : null}
      </Sheet>

      {/* New recipe */}
      <Sheet visible={creating} onClose={() => setCreating(false)} title={t('newRecipe')}>
        <View style={{ gap: S.md }}>
          <ChipRow>
            {ICONS.map((ic) => (
              <Chip key={ic} label={ic} active={newIcon === ic} onPress={() => setNewIcon(ic)} />
            ))}
          </ChipRow>
          <Field label={t('recipeName')} value={newTitle} onChangeText={setNewTitle} />
          <Field label={t('prepTime')} value={newTime} onChangeText={setNewTime} placeholder={t('prepTimePlaceholder')} />
          <T v="label" color={C.textMuted}>
            {t('ingredients').toUpperCase()}
          </T>
          {newIngredients.map((ing, i) => (
            <View key={i} style={{ gap: 6 }}>
              <View style={{ flexDirection: d.row, gap: 6 }}>
                <TextInput
                  value={ing.name}
                  onChangeText={(v) => setNewIngredients((p) => p.map((x, j) => (j === i ? { ...x, name: v } : x)))}
                  placeholder={t('itemName')}
                  placeholderTextColor={C.textFaint}
                  style={[styles.input, { flex: 1, textAlign: d.textAlign }]}
                />
                <TextInput
                  value={String(ing.amount)}
                  onChangeText={(v) => setNewIngredients((p) => p.map((x, j) => (j === i ? { ...x, amount: Number(v) || 0 } : x)))}
                  keyboardType="decimal-pad"
                  style={[styles.input, { width: 56, textAlign: 'center' }]}
                />
              </View>
              <View style={{ flexDirection: d.row, gap: 6 }}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setNewIngredients((p) => p.map((x, j) => (j === i ? { ...x, unit: u } : x)))}
                    style={[styles.unit, ing.unit === u && { backgroundColor: C.raised }]}
                  >
                    <T v="small" center color={ing.unit === u ? C.text : C.textMuted}>
                      {unitLabel(u)}
                    </T>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <Button
            kind="ghost"
            small
            label={t('addIngredient')}
            icon={<Plus size={16} color={C.accent} />}
            onPress={() => setNewIngredients((p) => [...p, { name: '', amount: 1, unit: 'units' }])}
          />
          <Button label={t('saveRecipe')} onPress={saveRecipe} disabled={!newTitle.trim()} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mealBox: { flex: 1, gap: 4, padding: S.md, borderRadius: R.md, backgroundColor: C.sunken, minHeight: 72 },
  input: { backgroundColor: C.sunken, borderRadius: R.sm, borderWidth: 1, borderColor: C.hairline, color: C.text, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14 },
  unit: { flex: 1, paddingVertical: 6, borderRadius: R.sm, backgroundColor: C.sunken },
});
