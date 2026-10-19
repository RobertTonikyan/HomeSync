import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { CalendarDays, Crown, Flame, HandHeart, Plus, RotateCcw, Trash2, UserRound } from 'lucide-react-native';
import { C, F, R, S } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { diffDays, formatDay, formatToday, todayISO } from '../../lib/dates';
import { lastWeekChampion, leader, Period, scoreboard } from '../../lib/competition';
import {
  Assignee,
  Chore,
  Effort,
  EFFORT_POINTS,
  MemberId,
  otherMember,
  RecurrenceType,
  RESCUE_BONUS_RATE,
} from '../../lib/types';
import {
  Avatar,
  Bar,
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
  Segmented,
  Sheet,
  T,
  inset,
  memberColor,
  success,
  tap,
  useDir,
} from '../../components/ui';

const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
const RECURRENCES: RecurrenceType[] = ['once', 'daily', 'every_2_days', 'weekly'];
const EFFORTS: Effort[] = ['light', 'normal', 'heavy'];

export default function ChoresScreen() {
  const app = useApp();
  const { t, language, me, memberName, chores, choreLogs, events } = app;
  const d = useDir();
  const self: MemberId = me || 'a';
  const partner = otherMember(self);
  const today = todayISO();

  const [tab, setTab] = useState<'chores' | 'calendar'>('chores');
  const [period, setPeriod] = useState<Period>('week');
  const [filter, setFilter] = useState<'all' | MemberId>('all');
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('weekly');
  const [assignee, setAssignee] = useState<Assignee>('anyone');
  const [effort, setEffort] = useState<Effort>('normal');
  const [selected, setSelected] = useState<Chore | null>(null);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventOwner, setEventOwner] = useState<Assignee>('anyone');

  const board = useMemo(() => scoreboard(choreLogs, period, today), [choreLogs, period, today]);
  const lead = leader(board);
  const champion = useMemo(() => lastWeekChampion(choreLogs, today), [choreLogs, today]);

  const visible = chores.filter((c) => filter === 'all' || c.assignedTo === filter || c.assignedTo === 'anyone');
  const due = visible.filter((c) => (c.recurrence === 'once' ? !c.isCompleted : c.dueAt <= today));
  const upcoming = visible.filter((c) => c.recurrence !== 'once' && c.dueAt > today);
  const done = visible.filter((c) => c.recurrence === 'once' && c.isCompleted);

  const assigneeName = (a: Assignee) => (a === 'anyone' ? t('both') : memberName(a));

  const dueLabel = (c: Chore) => {
    const n = diffDays(today, c.dueAt);
    if (n < 0) return t('overdueDays', { n: -n });
    if (n === 0) return t('dueToday');
    if (n === 1) return t('dueTomorrow');
    return t('dueInDays', { n });
  };

  const pointsFor = (c: Chore, who: MemberId) => {
    const base = EFFORT_POINTS[c.effort];
    return c.assignedTo === otherMember(who) ? base + Math.round(base * RESCUE_BONUS_RATE) : base;
  };

  const complete = async (c: Chore, who: MemberId = self) => {
    success();
    animate();
    setSelected(null);
    await app.completeChore(c, who);
  };

  const cycleAssignee = (c: Chore) => {
    tap();
    const order: Assignee[] = ['anyone', 'a', 'b'];
    app.updateChoreAssignee(c.id, order[(order.indexOf(c.assignedTo) + 1) % order.length]);
  };

  const addChore = async () => {
    if (!title.trim()) return;
    animate();
    const v = title;
    setTitle('');
    await app.addChore(v, recurrence, assignee, effort);
  };

  const choreRow = (c: Chore, kind: 'due' | 'upcoming' | 'done') => {
    const rescue = c.assignedTo === partner;
    const overdue = kind === 'due' && c.dueAt < today;
    const subtitle = (
      <Row gap={6} style={{ marginTop: 2, flexWrap: 'wrap' }}>
        <T v="small" color={overdue ? C.danger : C.textMuted}>
          {kind === 'done' ? t('doneBy', { name: c.lastDoneBy ? memberName(c.lastDoneBy) : '' }) : dueLabel(c)}
        </T>
        {kind !== 'done' ? (
          <>
            <T v="small" color={C.textFaint}>
              ·
            </T>
            <T v="small" color={rescue ? C.memberB : C.textMuted}>
              {rescue ? t('pointsRescue', { n: pointsFor(c, self) }) : t('pointsN', { n: pointsFor(c, self) })}
            </T>
          </>
        ) : null}
      </Row>
    );
    return (
      <ListRow
        key={c.id}
        title={c.title}
        subtitle={subtitle}
        muted={kind !== 'due'}
        strike={kind === 'done'}
        onPress={() => {
          tap();
          setSelected(c);
        }}
        leading={
          <CheckCircle
            checked={kind === 'done'}
            color={memberColor(self)}
            onPress={() => (kind === 'done' ? app.undoChore(c) : complete(c))}
          />
        }
        trailing={
          <Pressable hitSlop={8} onPress={() => cycleAssignee(c)}>
            <Avatar member={c.assignedTo} label={c.assignedTo === 'anyone' ? '∞' : memberName(c.assignedTo)} size={28} />
          </Pressable>
        }
      />
    );
  };

  const total = board.a.points + board.b.points;

  return (
    <Screen title={t('tabChores')} overline={formatToday(language)} right={<ProfileButton />}>
      {/* ---------- Scoreboard ---------- */}
      <Card style={{ marginTop: S.lg }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: S.lg }}>
          <T v="label" color={C.textMuted}>
            {t('scoreboard').toUpperCase()}
          </T>
          <Segmented
            style={{ width: 200 }}
            value={period}
            onChange={setPeriod}
            options={[
              { key: 'week', label: t('periodWeek') },
              { key: 'month', label: t('periodMonth') },
              { key: 'all', label: t('periodAll') },
            ]}
          />
        </Row>

        <Row style={{ alignItems: 'flex-start' }} gap={S.md}>
          {(['a', 'b'] as MemberId[]).map((m) => {
            const s = board[m];
            const isLead = lead === m;
            return (
              <View key={m} style={{ flex: 1, gap: 4 }}>
                <Row gap={6}>
                  <Avatar member={m} label={memberName(m)} size={24} />
                  <T v="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {memberName(m)}
                  </T>
                  {champion === m ? <Crown size={14} color={C.accent} /> : null}
                </Row>
                <T v="number" color={isLead ? memberColor(m) : C.text}>
                  {s.points}
                </T>
                <T v="small" color={C.textMuted}>
                  {t('doneCount', { n: s.done })}
                  {s.rescues ? ` · ${t('rescuesCount', { n: s.rescues })}` : ''}
                </T>
                {s.streak >= 2 ? (
                  <Row gap={4}>
                    <Flame size={13} color={C.accent} />
                    <T v="small" color={C.accent}>
                      {t('streakDays', { n: s.streak })}
                    </T>
                  </Row>
                ) : null}
              </View>
            );
          })}
        </Row>

        <View style={{ marginTop: S.lg }}>
          <Bar value={total ? board.a.points / total : 0.5} color={C.memberA} track={C.memberB} height={8} />
        </View>
        <T v="small" color={C.textSoft} style={{ marginTop: S.sm }}>
          {total === 0
            ? t('noPointsYet')
            : lead
              ? t('leadsBy', { name: memberName(lead), n: Math.abs(board.a.points - board.b.points) })
              : t('tied')}
        </T>
        <T v="small" color={C.textFaint} style={{ marginTop: 2 }}>
          {t('rescueRule')}
        </T>
      </Card>

      <Segmented
        style={[inset, { marginTop: S.xl }]}
        value={tab}
        onChange={setTab}
        options={[
          { key: 'chores', label: `${t('chores')} · ${due.length}` },
          { key: 'calendar', label: `${t('calendar')} · ${events.length}` },
        ]}
      />

      {tab === 'chores' ? (
        <>
          {/* ---------- Add chore ---------- */}
          <Card style={{ marginTop: S.md, gap: S.md }}>
            <View style={{ flexDirection: d.row, gap: S.sm, alignItems: 'center' }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                onSubmitEditing={addChore}
                placeholder={t('addChorePlaceholder')}
                placeholderTextColor={C.textFaint}
                selectionColor={C.accent}
                style={[styles.input, { textAlign: d.textAlign, writingDirection: d.writingDirection }]}
              />
              <Pressable onPress={addChore} disabled={!title.trim()} style={[styles.addBtn, !title.trim() && { opacity: 0.35 }]}>
                <Plus size={20} color={C.onAccent} strokeWidth={2.5} />
              </Pressable>
            </View>
            <ChipRow>
              {RECURRENCES.map((r) => (
                <Chip key={r} label={t(`rec_${r}` as any)} active={recurrence === r} onPress={() => setRecurrence(r)} />
              ))}
            </ChipRow>
            <ChipRow>
              {(['anyone', self, partner] as Assignee[]).map((a) => (
                <Chip key={a} label={assigneeName(a)} active={assignee === a} color={memberColor(a)} onPress={() => setAssignee(a)} />
              ))}
            </ChipRow>
            <ChipRow>
              {EFFORTS.map((e) => (
                <Chip
                  key={e}
                  label={`${t(`effort_${e}` as any)} · ${EFFORT_POINTS[e]}`}
                  active={effort === e}
                  onPress={() => setEffort(e)}
                />
              ))}
            </ChipRow>
          </Card>

          <View style={{ marginTop: S.lg }}>
            <ChipRow scroll>
              <Chip label={t('filterAll')} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={t('filterMine')} active={filter === self} color={memberColor(self)} onPress={() => setFilter(self)} />
              <Chip
                label={t('filterOf', { name: memberName(partner) })}
                active={filter === partner}
                color={memberColor(partner)}
                onPress={() => setFilter(partner)}
              />
            </ChipRow>
          </View>

          <Section label={t('dueNow')}>
            {due.length ? <List>{due.map((c) => choreRow(c, 'due'))}</List> : <Empty title={t('allCaughtUp')} body={t('allCaughtUpBody')} />}
          </Section>

          {upcoming.length ? (
            <Section label={t('comingUp')}>
              <List>{upcoming.map((c) => choreRow(c, 'upcoming'))}</List>
            </Section>
          ) : null}

          {done.length ? (
            <Section label={t('completed')}>
              <List>{done.map((c) => choreRow(c, 'done'))}</List>
            </Section>
          ) : null}

          {choreLogs.length ? (
            <Section label={t('activity')}>
              <List>
                {choreLogs.slice(0, 8).map((l) => (
                  <ListRow
                    key={l.id}
                    title={l.title}
                    subtitle={`${memberName(l.doneBy)} · ${formatDay(l.day, language)}`}
                    leading={<Avatar member={l.doneBy} label={memberName(l.doneBy)} size={28} />}
                    trailing={
                      <View style={{ alignItems: 'flex-end' }}>
                        <T v="bodyStrong" color={memberColor(l.doneBy)}>
                          +{l.points + l.bonus}
                        </T>
                        {l.bonus ? (
                          <T v="small" color={C.memberB}>
                            {t('rescued')}
                          </T>
                        ) : null}
                      </View>
                    }
                  />
                ))}
              </List>
            </Section>
          ) : null}
        </>
      ) : (
        <>
          {/* ---------- Calendar ---------- */}
          <Card style={{ marginTop: S.md, gap: S.md }}>
            <Field value={eventTitle} onChangeText={setEventTitle} placeholder={t('addEventPlaceholder')} />
            <Field value={eventDate} onChangeText={setEventDate} placeholder={t('eventDatePlaceholder')} />
            <ChipRow>
              {(['anyone', self, partner] as Assignee[]).map((a) => (
                <Chip key={a} label={assigneeName(a)} active={eventOwner === a} color={memberColor(a)} onPress={() => setEventOwner(a)} />
              ))}
            </ChipRow>
            <Button
              label={t('addEvent')}
              disabled={!eventTitle.trim()}
              onPress={async () => {
                animate();
                await app.addEvent(eventTitle, eventDate || t('soon'), eventOwner);
                setEventTitle('');
                setEventDate('');
              }}
            />
          </Card>
          <Section label={t('upcomingEvents')}>
            {events.length ? (
              <List>
                {events.map((e) => (
                  <ListRow
                    key={e.id}
                    title={e.title}
                    subtitle={e.date}
                    leading={
                      <View style={styles.eventIcon}>
                        <CalendarDays size={16} color={memberColor(e.owner)} />
                      </View>
                    }
                    trailing={
                      <IconButton onPress={() => app.deleteEvent(e.id)} accessibilityLabel={t('delete')}>
                        <Trash2 size={16} color={C.textFaint} />
                      </IconButton>
                    }
                  />
                ))}
              </List>
            ) : (
              <Empty title={t('noEvents')} />
            )}
          </Section>
        </>
      )}

      {/* ---------- Chore actions ---------- */}
      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''}>
        {selected ? (
          <View style={{ gap: S.sm }}>
            <T v="small" color={C.textMuted} style={{ marginBottom: S.sm }}>
              {t(`rec_${selected.recurrence}` as any)} · {t(`effort_${selected.effort}` as any)} · {assigneeName(selected.assignedTo)}
            </T>
            {!(selected.recurrence === 'once' && selected.isCompleted) ? (
              <>
                <Button
                  label={t('iDidIt', { n: pointsFor(selected, self) })}
                  icon={<UserRound size={18} color={C.onAccent} />}
                  onPress={() => complete(selected, self)}
                />
                <Button
                  kind="secondary"
                  label={t('partnerDidIt', { name: memberName(partner), n: pointsFor(selected, partner) })}
                  icon={<HandHeart size={18} color={C.text} />}
                  onPress={() => complete(selected, partner)}
                />
              </>
            ) : (
              <Button
                kind="secondary"
                label={t('undo')}
                icon={<RotateCcw size={18} color={C.text} />}
                onPress={() => {
                  app.undoChore(selected);
                  setSelected(null);
                }}
              />
            )}
            <T v="label" color={C.textMuted} style={{ marginTop: S.md }}>
              {t('assignTo').toUpperCase()}
            </T>
            <ChipRow>
              {(['anyone', self, partner] as Assignee[]).map((a) => (
                <Chip
                  key={a}
                  label={assigneeName(a)}
                  active={selected.assignedTo === a}
                  color={memberColor(a)}
                  onPress={() => {
                    app.updateChoreAssignee(selected.id, a);
                    setSelected({ ...selected, assignedTo: a });
                  }}
                />
              ))}
            </ChipRow>
            <Button
              kind="danger"
              label={t('deleteChore')}
              icon={<Trash2 size={18} color={C.danger} />}
              style={{ marginTop: S.lg }}
              onPress={() => {
                animate();
                app.deleteChore(selected.id);
                setSelected(null);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { flex: 1, color: C.text, ...F.body, paddingVertical: 8 },
  addBtn: { width: 40, height: 40, borderRadius: R.md, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  eventIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' },
});
