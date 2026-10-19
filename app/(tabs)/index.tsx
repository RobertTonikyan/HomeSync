import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, TextInput, UIManager, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, ChevronUp, Plus, Receipt, Store, Trash2 } from 'lucide-react-native';
import { C, F, R, S, money } from '../../constants/theme';
import { CATEGORY_ORDER, QUICK_FAVORITES, UNITS, UnitType } from '../../constants/Categories';
import { useApp, ShoppingItem } from '../../context/AppContext';
import { recommendStore } from '../../lib/prices';
import { formatToday } from '../../lib/dates';
import {
  Button,
  CheckCircle,
  Chip,
  ChipRow,
  Empty,
  IconButton,
  List,
  ListRow,
  ProfileButton,
  Row,
  Screen,
  Section,
  Sheet,
  T,
  inset,
  thud,
  useDir,
} from '../../components/ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export default function ShoppingScreen() {
  const { t, language, shoppingItems, addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCompletedShoppingItems, expenses } =
    useApp();
  const d = useDir();
  const [input, setInput] = useState('');
  const [unit, setUnit] = useState<UnitType>('units');
  const [showCollected, setShowCollected] = useState(false);
  const [storeSheet, setStoreSheet] = useState(false);

  const active = shoppingItems.filter((i) => !i.isCompleted);
  const collected = shoppingItems.filter((i) => i.isCompleted);

  const rec = useMemo(
    () => recommendStore(expenses, shoppingItems.map((i) => i.name)),
    [expenses, shoppingItems]
  );

  const unitLabel = (u: UnitType) => t(`unit_${u}` as any);

  const add = async (name: string, amount = 1, u: UnitType = unit) => {
    if (!name.trim()) return;
    thud();
    animate();
    setInput('');
    await addShoppingItem(name.trim(), amount, u);
  };

  const toggle = (item: ShoppingItem) => {
    thud();
    animate();
    toggleShoppingItem(item.id, item.isCompleted);
  };

  const groups = CATEGORY_ORDER.map((key) => ({ key, items: active.filter((i) => i.category === key) })).filter((g) => g.items.length);

  return (
    <Screen title={t('tabShopping')} overline={formatToday(language)} right={<ProfileButton />}>
      <T v="small" color={C.textMuted} style={inset}>
        {active.length ? t('itemsLeft', { n: active.length }) : t('listEmptyShort')}
      </T>

      {/* Cheapest store */}
      {rec ? (
        <Pressable onPress={() => setStoreSheet(true)} style={[styles.storeBanner, { flexDirection: d.row }]}>
          <View style={styles.storeIcon}>
            <Store size={18} color={C.positive} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="label" color={C.positive}>
              {(rec.scope === 'list' ? t('cheapestForList') : t('cheapestOverall')).toUpperCase()}
            </T>
            <T v="bodyStrong">{rec.best}</T>
            <T v="small" color={C.textMuted}>
              {t('saveVs', { amount: money(rec.saving), store: rec.comparedTo, n: rec.itemsCompared })}
            </T>
          </View>
        </Pressable>
      ) : null}

      {/* Add item */}
      <View style={[styles.addCard, inset]}>
        <View style={{ flexDirection: d.row, alignItems: 'center', gap: S.sm }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => add(input)}
            placeholder={t('addItemPlaceholder')}
            placeholderTextColor={C.textFaint}
            selectionColor={C.accent}
            returnKeyType="done"
            submitBehavior="submit"
            style={[styles.addInput, { textAlign: d.textAlign, writingDirection: d.writingDirection }]}
          />
          <Pressable
            onPress={() => add(input)}
            disabled={!input.trim()}
            style={[styles.addBtn, !input.trim() && { opacity: 0.35 }]}
            accessibilityLabel={t('add')}
          >
            <Plus size={20} color={C.onAccent} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View style={{ flexDirection: d.row, gap: 6, marginTop: S.sm }}>
          {UNITS.map((u) => (
            <Pressable key={u} onPress={() => setUnit(u)} style={[styles.unit, unit === u && styles.unitActive]}>
              <T v="small" color={unit === u ? C.text : C.textMuted} center>
                {unitLabel(u)}
              </T>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ marginTop: S.md }}>
        <ChipRow scroll>
          {QUICK_FAVORITES[language].map((f) => (
            <Chip key={f.name} label={`+ ${f.name}`} onPress={() => add(f.name, f.defaultAmount, f.defaultUnit)} />
          ))}
        </ChipRow>
      </View>

      {groups.length === 0 && collected.length === 0 ? (
        <Empty title={t('emptyShoppingTitle')} body={t('emptyShoppingSub')} />
      ) : null}

      {groups.map((g) => (
        <Section key={g.key} label={t(`cat_${g.key}` as any)}>
          <List>
            {g.items.map((item) => (
              <ListRow
                key={item.id}
                title={item.name}
                subtitle={`${item.amount} ${unitLabel(item.unit)}`}
                onPress={() => toggle(item)}
                leading={<CheckCircle checked={false} onPress={() => toggle(item)} />}
                trailing={
                  <IconButton onPress={() => deleteShoppingItem(item.id)} accessibilityLabel={t('delete')}>
                    <Trash2 size={16} color={C.textFaint} />
                  </IconButton>
                }
              />
            ))}
          </List>
        </Section>
      ))}

      {collected.length > 0 ? (
        <Section
          label={t('collectedN', { n: collected.length })}
          action={
            <Pressable
              hitSlop={8}
              onPress={() => {
                animate();
                setShowCollected(!showCollected);
              }}
            >
              {showCollected ? <ChevronUp size={18} color={C.textMuted} /> : <ChevronDown size={18} color={C.textMuted} />}
            </Pressable>
          }
        >
          {showCollected ? (
            <List style={{ marginBottom: S.md }}>
              {collected.map((item) => (
                <ListRow
                  key={item.id}
                  title={item.name}
                  muted
                  strike
                  onPress={() => toggle(item)}
                  leading={<CheckCircle checked onPress={() => toggle(item)} />}
                />
              ))}
            </List>
          ) : null}
          <Row style={[inset, { gap: S.sm }]}>
            <Button
              label={t('addReceipt')}
              icon={<Receipt size={18} color={C.onAccent} />}
              onPress={() => router.push({ pathname: '/expense', params: { fromList: '1' } })}
              style={{ flex: 1 }}
            />
            <Button
              kind="secondary"
              label={t('clearCollected')}
              onPress={() => {
                animate();
                clearCompletedShoppingItems();
              }}
            />
          </Row>
          <T v="small" color={C.textFaint} style={[inset, { marginTop: S.sm }]}>
            {t('addReceiptHint')}
          </T>
        </Section>
      ) : null}

      <Sheet visible={storeSheet} onClose={() => setStoreSheet(false)} title={t('priceComparison')}>
        {rec ? (
          <View style={{ gap: S.md }}>
            <T v="body" color={C.textSoft}>
              {t('priceComparisonBody', { best: rec.best, other: rec.comparedTo, pct: Math.round(rec.savingPct * 100) })}
            </T>
            <View style={{ borderRadius: R.md, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.hairline }}>
              {rec.items.map((it, i) => (
                <View key={it.name + i} style={[{ padding: S.md, gap: 6 }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline }]}>
                  <T v="bodyStrong">{it.name}</T>
                  {it.prices.map((p, j) => (
                    <Row key={p.store} style={{ justifyContent: 'space-between' }}>
                      <T v="small" color={j === 0 ? C.positive : C.textMuted}>
                        {p.store}
                      </T>
                      <T v="small" color={j === 0 ? C.positive : C.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
                        {money(p.unitPrice, { decimals: true })}
                      </T>
                    </Row>
                  ))}
                </View>
              ))}
            </View>
            <T v="small" color={C.textFaint}>
              {t('priceComparisonFoot')}
            </T>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  storeBanner: {
    marginHorizontal: S.gutter,
    marginTop: S.lg,
    padding: S.md,
    gap: S.md,
    alignItems: 'center',
    borderRadius: R.lg,
    backgroundColor: C.positiveSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(134,184,155,0.35)',
  },
  storeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(134,184,155,0.18)', alignItems: 'center', justifyContent: 'center' },
  addCard: {
    marginTop: S.lg,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    padding: S.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
  },
  addInput: { flex: 1, color: C.text, ...F.body, paddingHorizontal: S.sm, paddingVertical: 10 },
  addBtn: { width: 40, height: 40, borderRadius: R.md, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  unit: { flex: 1, paddingVertical: 6, borderRadius: R.sm, backgroundColor: C.sunken },
  unitActive: { backgroundColor: C.raised },
});
