import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, ChevronLeft, ChevronRight, Info, Lightbulb, Plus, Receipt, Store } from 'lucide-react-native';
import { C, R, S, money } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { EXPENSE_ICONS } from '../../constants/expenseCategories';
import { formatDay, formatMonth, monthKey, shiftMonth, todayISO } from '../../lib/dates';
import { savingsTips, settleUp, summarizeMonth, Tip } from '../../lib/insights';
import { recommendStore } from '../../lib/prices';
import type { MemberId } from '../../lib/types';
import {
  Avatar,
  Bar,
  Button,
  Card,
  Empty,
  IconButton,
  List,
  ListRow,
  ProfileButton,
  Row,
  Screen,
  Section,
  T,
  inset,
  memberColor,
  useDir,
} from '../../components/ui';

export default function MoneyScreen() {
  const { t, language, expenses, household, memberName, shoppingItems, rtl } = useApp();
  const d = useDir();
  const thisMonth = monthKey(todayISO());
  const [month, setMonth] = useState(thisMonth);

  const sum = useMemo(() => summarizeMonth(expenses, month), [expenses, month]);
  const prev = useMemo(() => summarizeMonth(expenses, shiftMonth(month, -1)), [expenses, month]);
  const tips = useMemo(
    () => savingsTips(expenses, month, household.monthlyBudget, shoppingItems.map((i) => i.name)),
    [expenses, month, household.monthlyBudget, shoppingItems]
  );
  const rec = useMemo(() => recommendStore(expenses, shoppingItems.map((i) => i.name)), [expenses, shoppingItems]);
  const settle = settleUp(sum.byMember);
  const monthExpenses = expenses.filter((e) => monthKey(e.date) === month);

  const change = prev.total > 0 ? (sum.total - prev.total) / prev.total : null;
  const budget = household.monthlyBudget;

  const catLabel = (c: string) => t(`exp_${c}` as any);

  const tipText = (tip: Tip, key: string) => {
    const params = { ...tip.params };
    if (typeof params.category === 'string') params.category = catLabel(params.category);
    for (const k of ['extra', 'saving', 'projected', 'over', 'perDay', 'monthly', 'sum']) {
      if (typeof params[k] === 'number') params[k] = money(params[k] as number);
    }
    return t(key as any, params);
  };

  // Arrows follow reading direction: "previous" points to the reading start.
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <Screen title={t('tabMoney')} right={<ProfileButton />}>
      {/* Month switcher */}
      <Row style={[inset, { justifyContent: 'space-between', marginTop: S.sm }]}>
        <IconButton onPress={() => setMonth(shiftMonth(month, -1))} accessibilityLabel={t('previousMonth')}>
          <PrevIcon size={20} color={C.textSoft} />
        </IconButton>
        <T v="heading">{formatMonth(month, language)}</T>
        <IconButton
          onPress={() => month < thisMonth && setMonth(shiftMonth(month, 1))}
          style={month >= thisMonth ? { opacity: 0.25 } : undefined}
          accessibilityLabel={t('nextMonth')}
        >
          <NextIcon size={20} color={C.textSoft} />
        </IconButton>
      </Row>

      {/* Headline */}
      <Card style={{ marginTop: S.md }}>
        <T v="label" color={C.textMuted}>
          {t('spentThisMonth').toUpperCase()}
        </T>
        <T v="number" style={{ marginTop: 4 }}>
          {money(sum.total)}
        </T>
        {change !== null ? (
          <T v="small" color={change > 0.05 ? C.danger : change < -0.05 ? C.positive : C.textMuted}>
            {change >= 0
              ? t('moreThanLastMonth', { pct: Math.round(change * 100), amount: money(prev.total) })
              : t('lessThanLastMonth', { pct: Math.round(-change * 100), amount: money(prev.total) })}
          </T>
        ) : (
          <T v="small" color={C.textMuted}>
            {t('expensesCount', { n: sum.count })}
          </T>
        )}
        {budget ? (
          <View style={{ marginTop: S.lg, gap: 6 }}>
            <Bar value={sum.total / budget} color={sum.total > budget ? C.danger : C.accent} />
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="small" color={C.textMuted}>
                {t('budgetOf', { amount: money(budget) })}
              </T>
              <T v="small" color={sum.total > budget ? C.danger : C.textSoft}>
                {sum.total > budget ? t('overBy', { amount: money(sum.total - budget) }) : t('leftAmount', { amount: money(budget - sum.total) })}
              </T>
            </Row>
          </View>
        ) : null}
        <Row style={{ marginTop: S.lg }} gap={S.sm}>
          <Button label={t('addExpense')} icon={<Plus size={18} color={C.onAccent} />} onPress={() => router.push('/expense')} style={{ flex: 1 }} />
          <Button
            kind="secondary"
            label={t('receipt')}
            icon={<Receipt size={18} color={C.text} />}
            onPress={() => router.push({ pathname: '/expense', params: { receipt: '1' } })}
            style={{ flex: 1 }}
          />
        </Row>
      </Card>

      {/* Tips */}
      {tips.length ? (
        <Section label={t('howToSave')}>
          <View style={{ gap: S.sm }}>
            {tips.map((tip) => {
              const Icon = tip.tone === 'warn' ? AlertTriangle : tip.tone === 'save' ? Lightbulb : Info;
              const color = tip.tone === 'warn' ? C.danger : tip.tone === 'save' ? C.positive : C.textSoft;
              return (
                <Card key={tip.id} style={{ flexDirection: d.row, gap: S.md, alignItems: 'flex-start' }}>
                  <View style={[styles.tipIcon, { backgroundColor: color + '22' }]}>
                    <Icon size={16} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="bodyStrong">{tipText(tip, tip.titleKey)}</T>
                    <T v="small" color={C.textSoft}>
                      {tipText(tip, tip.bodyKey)}
                    </T>
                  </View>
                </Card>
              );
            })}
          </View>
        </Section>
      ) : null}

      {/* Categories */}
      {sum.byCategory.length ? (
        <Section label={t('byCategory')}>
          <Card style={{ gap: S.lg }}>
            {sum.byCategory.map((c) => {
              const Icon = EXPENSE_ICONS[c.category];
              const max = sum.byCategory[0].amount || 1;
              return (
                <View key={c.category} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Row gap={8}>
                      <Icon size={15} color={C.textSoft} />
                      <T v="body">{catLabel(c.category)}</T>
                    </Row>
                    <T v="body" style={{ fontVariant: ['tabular-nums'] }}>
                      {money(c.amount)}{' '}
                      <T v="small" color={C.textMuted}>
                        {Math.round(c.share * 100)}%
                      </T>
                    </T>
                  </Row>
                  <Bar value={c.amount / max} />
                </View>
              );
            })}
          </Card>
        </Section>
      ) : null}

      {/* Who paid */}
      {sum.total > 0 ? (
        <Section label={t('whoPaid')}>
          <Card style={{ gap: S.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              {(['a', 'b'] as MemberId[]).map((m) => (
                <Row key={m} gap={8}>
                  <Avatar member={m} label={memberName(m)} size={24} />
                  <View>
                    <T v="small" color={C.textMuted}>
                      {memberName(m)}
                    </T>
                    <T v="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
                      {money(sum.byMember[m])}
                    </T>
                  </View>
                </Row>
              ))}
            </Row>
            <Bar value={sum.byMember.a / sum.total} color={C.memberA} track={C.memberB} height={8} />
            <T v="small" color={C.textSoft}>
              {settle
                ? t('settleUp', { from: memberName(settle.from), to: memberName(settle.to), amount: money(settle.amount) })
                : t('evenSplit')}
            </T>
          </Card>
        </Section>
      ) : null}

      {/* Store comparison */}
      {rec ? (
        <Section label={t('supermarkets')}>
          <Card style={{ flexDirection: d.row, gap: S.md, alignItems: 'center' }}>
            <View style={[styles.tipIcon, { backgroundColor: C.positiveSoft }]}>
              <Store size={16} color={C.positive} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="bodyStrong">{t('cheapestIs', { store: rec.best })}</T>
              <T v="small" color={C.textSoft}>
                {t('cheaperByPct', { pct: Math.round(rec.savingPct * 100), store: rec.comparedTo, n: rec.itemsCompared })}
              </T>
            </View>
          </Card>
        </Section>
      ) : null}

      {/* Transactions */}
      <Section label={t('transactions')}>
        {monthExpenses.length ? (
          <List>
            {monthExpenses.map((e) => {
              const Icon = EXPENSE_ICONS[e.category];
              return (
                <ListRow
                  key={e.id}
                  title={e.store || e.note || catLabel(e.category)}
                  subtitle={`${formatDay(e.date, language)} · ${memberName(e.paidBy)}${e.items.length ? ` · ${t('itemsN', { n: e.items.length })}` : ''}`}
                  onPress={() => router.push({ pathname: '/expense', params: { id: e.id } })}
                  leading={
                    <View style={[styles.catIcon, { borderColor: memberColor(e.paidBy) + '66' }]}>
                      {e.hasPhoto || e.items.length ? <Receipt size={16} color={C.textSoft} /> : <Icon size={16} color={C.textSoft} />}
                    </View>
                  }
                  trailing={
                    <T v="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
                      {money(e.amount, { decimals: e.amount % 1 !== 0 })}
                    </T>
                  }
                />
              );
            })}
          </List>
        ) : (
          <Empty title={t('noExpensesTitle')} body={t('noExpensesBody')} />
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tipIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catIcon: { width: 34, height: 34, borderRadius: R.md, backgroundColor: C.raised, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
