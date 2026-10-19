import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dices, Home, Mountain, PenLine, Trash2, Utensils } from 'lucide-react-native';
import { C, R, S } from '../../constants/theme';
import { BUILT_IN_DATE_IDEAS } from '../../constants/content';
import { useApp } from '../../context/AppContext';
import type { DateCategory } from '../../lib/types';
import {
  Button,
  Card,
  CheckCircle,
  Chip,
  ChipRow,
  Empty,
  Field,
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
  success,
  thud,
} from '../../components/ui';

const CATS: DateCategory[] = ['food', 'home', 'outdoor'];
const CAT_ICON = { food: Utensils, home: Home, outdoor: Mountain };

export default function UsScreen() {
  const { t, language, dateIdeas, addDateIdea, toggleDateIdea, deleteDateIdea, dailyNote, updateDailyNote } = useApp();
  const [filter, setFilter] = useState<'all' | DateCategory>('all');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [cat, setCat] = useState<DateCategory>('food');
  const [picked, setPicked] = useState<{ title: string; category: DateCategory; note?: string } | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(dailyNote);

  useEffect(() => {
    if (!editingNote) setNoteDraft(dailyNote);
  }, [dailyNote, editingNote]);

  const spin = () => {
    thud();
    const pool = [
      ...dateIdeas.filter((i) => !i.isCompleted).map((i) => ({ title: i.title, category: i.category, note: i.note })),
      ...BUILT_IN_DATE_IDEAS[language],
    ];
    if (!pool.length) return;
    setPicked(pool[Math.floor(Math.random() * pool.length)]);
  };

  const add = async () => {
    if (!title.trim()) return;
    await addDateIdea(title, cat, note);
    success();
    setTitle('');
    setNote('');
  };

  const list = dateIdeas.filter((i) => filter === 'all' || i.category === filter);

  return (
    <Screen title={t('tabUs')} right={<ProfileButton />}>
      {/* Shared note */}
      <Section label={t('sharedNote')} style={{ marginTop: S.lg }}>
        <Card>
          {editingNote ? (
            <View style={{ gap: S.md }}>
              <Field value={noteDraft} onChangeText={setNoteDraft} multiline placeholder={t('notePlaceholderLove')} style={{ minHeight: 90, textAlignVertical: 'top' }} autoFocus />
              <Row gap={S.sm}>
                <Button kind="secondary" label={t('cancel')} onPress={() => setEditingNote(false)} style={{ flex: 1 }} />
                <Button
                  label={t('save')}
                  style={{ flex: 1 }}
                  onPress={async () => {
                    await updateDailyNote(noteDraft);
                    success();
                    setEditingNote(false);
                  }}
                />
              </Row>
            </View>
          ) : (
            <Row style={{ alignItems: 'flex-start' }}>
              <T v="heading" color={dailyNote ? C.text : C.textFaint} style={{ flex: 1, fontWeight: '500', lineHeight: 24 }}>
                {dailyNote || t('noteEmpty')}
              </T>
              <IconButton onPress={() => setEditingNote(true)} accessibilityLabel={t('edit')}>
                <PenLine size={18} color={C.textMuted} />
              </IconButton>
            </Row>
          )}
        </Card>
      </Section>

      {/* Roulette */}
      <Card style={{ marginTop: S.xl, gap: S.md }}>
        <T v="title">{t('rouletteTitle')}</T>
        <T v="small" color={C.textMuted}>
          {t('rouletteSub')}
        </T>
        <Button label={t('spin')} icon={<Dices size={18} color={C.onAccent} />} onPress={spin} />
      </Card>

      {/* Ideas */}
      <Section label={t('ourIdeas')}>
        <View style={{ marginBottom: S.md }}>
          <ChipRow scroll>
            <Chip label={t('filterAll')} active={filter === 'all'} onPress={() => setFilter('all')} />
            {CATS.map((c) => {
              const Icon = CAT_ICON[c];
              return (
                <Chip
                  key={c}
                  label={t(`date_${c}` as any)}
                  active={filter === c}
                  icon={<Icon size={14} color={filter === c ? C.accent : C.textMuted} />}
                  onPress={() => setFilter(c)}
                />
              );
            })}
          </ChipRow>
        </View>

        <Card style={{ gap: S.md, marginBottom: S.md }}>
          <Field value={title} onChangeText={setTitle} placeholder={t('addDatePlaceholder')} onSubmitEditing={add} />
          <Field value={note} onChangeText={setNote} placeholder={t('dateNotePlaceholder')} />
          <ChipRow>
            {CATS.map((c) => (
              <Chip key={c} label={t(`date_${c}` as any)} active={cat === c} onPress={() => setCat(c)} />
            ))}
          </ChipRow>
          <Button kind="secondary" label={t('addIdea')} onPress={add} disabled={!title.trim()} />
        </Card>

        {list.length ? (
          <List>
            {list.map((i) => {
              const Icon = CAT_ICON[i.category] || Utensils;
              return (
                <ListRow
                  key={i.id}
                  title={i.title}
                  subtitle={i.note || undefined}
                  muted={i.isCompleted}
                  strike={i.isCompleted}
                  onPress={() => toggleDateIdea(i.id, i.isCompleted)}
                  leading={<CheckCircle checked={i.isCompleted} onPress={() => toggleDateIdea(i.id, i.isCompleted)} />}
                  trailing={
                    <Row gap={2}>
                      <Icon size={15} color={C.textFaint} />
                      <IconButton onPress={() => deleteDateIdea(i.id)} accessibilityLabel={t('delete')}>
                        <Trash2 size={16} color={C.textFaint} />
                      </IconButton>
                    </Row>
                  }
                />
              );
            })}
          </List>
        ) : (
          <Empty title={t('noIdeasTitle')} body={t('noIdeasBody')} />
        )}
      </Section>

      <Sheet visible={!!picked} onClose={() => setPicked(null)} title={t('tonight')}>
        {picked ? (
          <View style={{ gap: S.lg }}>
            <View style={styles.picked}>
              <T v="label" color={C.accent}>
                {t(`date_${picked.category}` as any).toUpperCase()}
              </T>
              <T v="title">{picked.title}</T>
              {picked.note ? (
                <T v="body" color={C.textSoft}>
                  {picked.note}
                </T>
              ) : null}
            </View>
            <Row gap={S.sm}>
              <Button kind="secondary" label={t('spinAgain')} onPress={spin} style={{ flex: 1 }} />
              <Button label={t('deal')} onPress={() => setPicked(null)} style={{ flex: 1 }} />
            </Row>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  picked: { gap: 6, padding: S.lg, borderRadius: R.lg, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(232,164,98,0.3)' },
});
