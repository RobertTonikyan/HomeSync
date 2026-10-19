import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { C, CURRENCY, S } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../constants/translations';
import { HOUSEHOLD_ID } from '../services/firebase';
import { Avatar, Button, Card, Field, IconButton, List, ListRow, Row, Section, T, success } from '../components/ui';
import type { MemberId } from '../lib/types';

export default function Settings() {
  const { t, language, setLanguage, me, setMe, household, memberName, updateMemberNames, setMonthlyBudget } = useApp();
  const [nameA, setNameA] = useState(household.members.a.name);
  const [nameB, setNameB] = useState(household.members.b.name);
  const [budget, setBudget] = useState(household.monthlyBudget ? String(household.monthlyBudget) : '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNameA(household.members.a.name);
    setNameB(household.members.b.name);
    setBudget(household.monthlyBudget ? String(household.monthlyBudget) : '');
  }, [household]);

  const dirty =
    nameA.trim() !== household.members.a.name ||
    nameB.trim() !== household.members.b.name ||
    (budget ? Number(budget) : null) !== household.monthlyBudget;

  const save = () => {
    const b = Number(budget.replace(/[^\d.]/g, ''));
    Promise.all([updateMemberNames(nameA || household.members.a.name, nameB || household.members.b.name), setMonthlyBudget(b > 0 ? b : null)]).catch((e) =>
      console.warn(e)
    );
    success();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: S.gutter, paddingTop: S.md }}>
        <T v="display">{t('settings')}</T>
        <IconButton onPress={() => router.back()} accessibilityLabel={t('close')}>
          <X size={22} color={C.textSoft} />
        </IconButton>
      </Row>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Section label={t('language')}>
          <List>
            {LANGUAGES.map((l) => (
              <ListRow
                key={l.code}
                title={l.native}
                subtitle={l.english}
                onPress={() => setLanguage(l.code)}
                trailing={language === l.code ? <Check size={20} color={C.accent} /> : null}
              />
            ))}
          </List>
        </Section>

        <Section label={t('thisPhoneBelongsTo')}>
          <List>
            {(['a', 'b'] as MemberId[]).map((m) => (
              <ListRow
                key={m}
                title={memberName(m)}
                leading={<Avatar member={m} label={memberName(m)} />}
                onPress={() => setMe(m)}
                trailing={me === m ? <Check size={20} color={C.accent} /> : null}
              />
            ))}
          </List>
        </Section>

        <Section label={t('household')}>
          <Card style={{ gap: S.lg }}>
            <Field label={t('partnerOne')} value={nameA} onChangeText={setNameA} />
            <Field label={t('partnerTwo')} value={nameB} onChangeText={setNameB} />
            <Field
              label={t('monthlyBudget', { currency: CURRENCY })}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              placeholder={t('budgetPlaceholder')}
            />
            <Button label={saved ? t('saved') : t('save')} onPress={save} disabled={!dirty && !saved} />
          </Card>
        </Section>

        <Section label={t('sync')}>
          <Card>
            <T v="small" color={C.textMuted}>
              {t('householdCodeHint')}
            </T>
            <View style={{ marginTop: S.sm }}>
              <T v="heading" style={{ letterSpacing: 1.5, fontVariant: ['tabular-nums'] }}>
                {HOUSEHOLD_ID}
              </T>
            </View>
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
