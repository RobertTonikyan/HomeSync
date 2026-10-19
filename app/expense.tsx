import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Plus, Trash2, X } from 'lucide-react-native';
import { C, CURRENCY, F, R, S, money } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { EXPENSE_CATEGORIES, EXPENSE_ICONS } from '../constants/expenseCategories';
import { addDays, formatDay, todayISO } from '../lib/dates';
import { knownStores } from '../lib/prices';
import type { ExpenseCategory, MemberId } from '../lib/types';
import { Button, Card, Chip, ChipRow, Field, IconButton, Row, Section, T, inset, memberColor, success, useDir } from '../components/ui';

interface LineDraft {
  name: string;
  price: string;
  qty: string;
}

const parseNum = (s: string) => {
  const n = Number(String(s).replace(',', '.').replace(/[^\d.]/g, ''));
  return isFinite(n) ? n : 0;
};

/** Shrink a photo so it fits comfortably in a Firestore document (< ~700KB base64). */
async function compressPhoto(uri: string): Promise<string | null> {
  const attempt = async (width: number, compress: number) => {
    const ctx = ImageManipulator.manipulate(uri);
    ctx.resize({ width });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ compress, format: SaveFormat.JPEG, base64: true });
    return out.base64 || null;
  };
  let b64 = await attempt(1000, 0.45);
  if (b64 && b64.length > 700_000) b64 = await attempt(760, 0.3);
  return b64 && b64.length <= 900_000 ? b64 : null;
}

export default function ExpenseScreen() {
  const params = useLocalSearchParams<{ id?: string; receipt?: string; fromList?: string }>();
  const { t, language, me, memberName, expenses, shoppingItems, saveExpense, deleteExpense, loadReceiptPhoto, clearCompletedShoppingItems, rtl } = useApp();
  const d = useDir();
  const existing = params.id ? expenses.find((e) => e.id === params.id) : undefined;
  const fromList = params.fromList === '1';

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [amountTouched, setAmountTouched] = useState(!!existing);
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category || 'groceries');
  const [store, setStore] = useState(existing?.store || '');
  const [date, setDate] = useState(existing?.date || todayISO());
  const [paidBy, setPaidBy] = useState<MemberId>(existing?.paidBy || me || 'a');
  const [note, setNote] = useState(existing?.note || '');
  const [showItems, setShowItems] = useState(!!(existing?.items.length || params.receipt || fromList));
  const [lines, setLines] = useState<LineDraft[]>(() => {
    if (existing?.items.length) return existing.items.map((i) => ({ name: i.name, price: String(i.price), qty: String(i.qty) }));
    if (fromList) {
      const collected = shoppingItems.filter((i) => i.isCompleted);
      if (collected.length) return collected.map((i) => ({ name: i.name, price: '', qty: '1' }));
    }
    return [{ name: '', price: '', qty: '1' }];
  });
  const [photo, setPhoto] = useState<string | null>(null); // new photo (base64)
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing?.hasPhoto) loadReceiptPhoto(existing.id).then(setSavedPhoto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const stores = useMemo(() => knownStores(expenses).slice(0, 6), [expenses]);
  const linesTotal = lines.reduce((s, l) => s + parseNum(l.price), 0);
  const effectiveAmount = amountTouched ? parseNum(amount) : linesTotal || parseNum(amount);
  const shownPhoto = photo || savedPhoto;

  const updateLine = (i: number, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const pickPhoto = async (source: 'camera' | 'library') => {
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('permissionNeeded'), t('permissionPhotoBody'));
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]) return;
      setPhotoBusy(true);
      const b64 = await compressPhoto(res.assets[0].uri);
      setPhotoBusy(false);
      if (!b64) {
        Alert.alert(t('photoTooLarge'));
        return;
      }
      setPhoto(b64);
      setShowItems(true);
    } catch (e) {
      setPhotoBusy(false);
      console.warn(e);
    }
  };

  const save = () => {
    if (!(effectiveAmount > 0)) {
      Alert.alert(t('amountMissing'));
      return;
    }
    setSaving(true);
    saveExpense(
      {
        amount: effectiveAmount,
        category,
        store,
        date,
        paidBy,
        note,
        items: showItems
          ? lines.filter((l) => l.name.trim() && parseNum(l.price) > 0).map((l) => ({ name: l.name, price: parseNum(l.price), qty: parseNum(l.qty) || 1 }))
          : [],
      },
      { id: existing?.id, photoBase64: photo }
    ).catch((e) => {
      console.warn(e);
      Alert.alert(t('saveFailed'));
    });
    // The write is queued locally and appears in the list immediately; don't wait for the server.
    if (fromList && !existing) clearCompletedShoppingItems().catch(() => {});
    success();
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(t('deleteExpenseQ'), undefined, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          deleteExpense(existing.id).catch((e) => console.warn(e));
          router.back();
        },
      },
    ]);
  };

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: S.gutter, paddingTop: S.md }}>
        <T v="title">{existing ? t('editExpense') : showItems ? t('newReceipt') : t('newExpense')}</T>
        <IconButton onPress={() => router.back()} accessibilityLabel={t('close')}>
          <X size={22} color={C.textSoft} />
        </IconButton>
      </Row>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Amount */}
        <View style={[inset, { marginTop: S.xl, alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', direction: 'ltr' }}>
            <T v="number" color={C.textMuted}>
              {CURRENCY}
            </T>
            <TextInput
              value={amountTouched ? amount : linesTotal ? linesTotal.toFixed(2).replace(/\.00$/, '') : amount}
              onChangeText={(v) => {
                setAmount(v);
                setAmountTouched(true);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={C.textFaint}
              selectionColor={C.accent}
              style={[F.number, { color: C.text, minWidth: 80, textAlign: 'center', fontVariant: ['tabular-nums'] }]}
            />
          </View>
          {showItems && amountTouched && linesTotal > 0 && Math.abs(linesTotal - parseNum(amount)) > 0.5 ? (
            <Pressable onPress={() => setAmountTouched(false)}>
              <T v="small" color={C.accent} center>
                {t('useItemsTotal', { amount: money(linesTotal, { decimals: true }) })}
              </T>
            </Pressable>
          ) : null}
        </View>

        <Section label={t('category')}>
          <View style={inset}>
            <ChipRow>
              {EXPENSE_CATEGORIES.map((c) => {
                const Icon = EXPENSE_ICONS[c];
                return (
                  <Chip
                    key={c}
                    label={t(`exp_${c}` as any)}
                    active={category === c}
                    icon={<Icon size={14} color={category === c ? C.accent : C.textMuted} />}
                    onPress={() => setCategory(c)}
                  />
                );
              })}
            </ChipRow>
          </View>
        </Section>

        <Section label={t('details')}>
          <Card style={{ gap: S.lg }}>
            <View style={{ gap: S.sm }}>
              <Field label={t('storeOrPlace')} value={store} onChangeText={setStore} placeholder={t('storePlaceholder')} />
              {stores.length ? (
                <ChipRow>
                  {stores.map((s) => (
                    <Chip key={s} label={s} active={store.trim() === s} onPress={() => setStore(s)} />
                  ))}
                </ChipRow>
              ) : null}
            </View>

            <View style={{ gap: 6 }}>
              <T v="label" color={C.textMuted}>
                {t('date').toUpperCase()}
              </T>
              <Row style={styles.dateRow}>
                <IconButton onPress={() => setDate(addDays(date, -1))} accessibilityLabel={t('previousDay')}>
                  <PrevIcon size={18} color={C.textSoft} />
                </IconButton>
                <T v="bodyStrong" center style={{ flex: 1 }}>
                  {date === todayISO() ? t('today') : formatDay(date, language)}
                </T>
                <IconButton
                  onPress={() => date < todayISO() && setDate(addDays(date, 1))}
                  style={date >= todayISO() ? { opacity: 0.25 } : undefined}
                  accessibilityLabel={t('nextDay')}
                >
                  <NextIcon size={18} color={C.textSoft} />
                </IconButton>
              </Row>
            </View>

            <View style={{ gap: 6 }}>
              <T v="label" color={C.textMuted}>
                {t('paidBy').toUpperCase()}
              </T>
              <ChipRow>
                {(['a', 'b'] as MemberId[]).map((m) => (
                  <Chip key={m} label={memberName(m)} active={paidBy === m} color={memberColor(m)} onPress={() => setPaidBy(m)} />
                ))}
              </ChipRow>
            </View>

            <Field label={t('note')} value={note} onChangeText={setNote} placeholder={t('notePlaceholder')} />
          </Card>
        </Section>

        {/* Receipt */}
        <Section label={t('receipt')}>
          <Card style={{ gap: S.md }}>
            {photoBusy ? (
              <View style={styles.photoBox}>
                <ActivityIndicator color={C.accent} />
              </View>
            ) : shownPhoto ? (
              <Pressable onPress={() => setViewer(true)}>
                <Image source={{ uri: `data:image/jpeg;base64,${shownPhoto}` }} style={styles.photo} resizeMode="cover" />
              </Pressable>
            ) : null}
            <Row gap={S.sm}>
              <Button
                kind="secondary"
                small
                label={t('takePhoto')}
                icon={<Camera size={16} color={C.text} />}
                onPress={() => pickPhoto('camera')}
                style={{ flex: 1 }}
              />
              <Button
                kind="secondary"
                small
                label={t('fromGallery')}
                icon={<ImagePlus size={16} color={C.text} />}
                onPress={() => pickPhoto('library')}
                style={{ flex: 1 }}
              />
            </Row>

            {!showItems ? (
              <Button kind="ghost" small label={t('addItemsPrices')} onPress={() => setShowItems(true)} />
            ) : (
              <View style={{ gap: S.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="label" color={C.textMuted}>
                    {t('itemsAndPrices').toUpperCase()}
                  </T>
                  <T v="small" color={C.textSoft} style={{ fontVariant: ['tabular-nums'] }}>
                    {money(linesTotal, { decimals: true })}
                  </T>
                </Row>
                <T v="small" color={C.textFaint}>
                  {t('itemsHint')}
                </T>
                {lines.map((l, i) => (
                  <View key={i} style={{ flexDirection: d.row, gap: 6, alignItems: 'center' }}>
                    <TextInput
                      value={l.name}
                      onChangeText={(v) => updateLine(i, { name: v })}
                      placeholder={t('itemName')}
                      placeholderTextColor={C.textFaint}
                      style={[styles.lineInput, { flex: 1, textAlign: d.textAlign }]}
                    />
                    <TextInput
                      value={l.qty}
                      onChangeText={(v) => updateLine(i, { qty: v })}
                      keyboardType="decimal-pad"
                      placeholder="1"
                      placeholderTextColor={C.textFaint}
                      style={[styles.lineInput, { width: 44, textAlign: 'center' }]}
                    />
                    <TextInput
                      value={l.price}
                      onChangeText={(v) => updateLine(i, { price: v })}
                      keyboardType="decimal-pad"
                      placeholder={CURRENCY}
                      placeholderTextColor={C.textFaint}
                      style={[styles.lineInput, { width: 72, textAlign: 'center' }]}
                    />
                    <IconButton onPress={() => setLines((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : [{ name: '', price: '', qty: '1' }]))}>
                      <Trash2 size={15} color={C.textFaint} />
                    </IconButton>
                  </View>
                ))}
                <Button
                  kind="ghost"
                  small
                  label={t('addLine')}
                  icon={<Plus size={16} color={C.accent} />}
                  onPress={() => setLines((p) => [...p, { name: '', price: '', qty: '1' }])}
                />
              </View>
            )}
          </Card>
        </Section>

        <View style={[inset, { marginTop: S.xxl, gap: S.sm }]}>
          <Button label={saving ? t('saving') : t('save')} onPress={save} disabled={saving} />
          {existing ? <Button kind="danger" label={t('deleteExpense')} onPress={remove} /> : null}
        </View>
      </ScrollView>

      <Modal visible={viewer} transparent animationType="fade" onRequestClose={() => setViewer(false)}>
        <Pressable style={styles.viewer} onPress={() => setViewer(false)}>
          {shownPhoto ? <Image source={{ uri: `data:image/jpeg;base64,${shownPhoto}` }} style={{ width: '100%', height: '85%' }} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dateRow: { justifyContent: 'space-between', backgroundColor: C.sunken, borderRadius: R.md, borderWidth: 1, borderColor: C.hairline, paddingHorizontal: 4, height: 46 },
  photoBox: { height: 180, borderRadius: R.md, backgroundColor: C.sunken, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: 220, borderRadius: R.md, backgroundColor: C.sunken },
  lineInput: { backgroundColor: C.sunken, borderRadius: R.sm, borderWidth: 1, borderColor: C.hairline, color: C.text, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14 },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: S.lg },
});
