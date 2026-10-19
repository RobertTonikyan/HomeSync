import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { C, R, S } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { LANGUAGES } from '../constants/translations';
import { Avatar, Button, Field, memberColor, Row, T, tap, useDir } from '../components/ui';
import type { MemberId } from '../lib/types';

export default function Welcome() {
  const { t, language, setLanguage, household, updateMemberNames, setMe } = useApp();
  const d = useDir();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [nameA, setNameA] = useState(household.members.a.name);
  const [nameB, setNameB] = useState(household.members.b.name);

  // Partner may have already set the names on their phone.
  useEffect(() => {
    if (!nameA && household.members.a.name) setNameA(household.members.a.name);
    if (!nameB && household.members.b.name) setNameB(household.members.b.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household]);

  // Firestore resolves writes only after the server confirms, so don't block the UI on it:
  // the write is queued locally and syncs when the connection is available.
  const saveNames = () => {
    updateMemberNames(nameA, nameB).catch((e) => console.warn(e));
    setStep(2);
  };

  const choose = (m: MemberId) => {
    tap();
    setMe(m);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <T v="label" color={C.accent}>
          HOMESYNC
        </T>

        {step === 0 && (
          <>
            <T v="display" style={{ marginTop: S.md }}>
              {t('welcomeTitle')}
            </T>
            <T v="body" color={C.textSoft} style={{ marginTop: S.sm }}>
              {t('welcomeLanguage')}
            </T>
            <View style={{ marginTop: S.xxl, gap: S.sm }}>
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    tap();
                    setLanguage(l.code);
                  }}
                  style={[styles.option, { flexDirection: d.row }, language === l.code && styles.optionActive]}
                >
                  <T v="heading" style={{ flex: 1 }}>
                    {l.native}
                  </T>
                  {language === l.code ? <Check size={20} color={C.accent} /> : null}
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <Button label={t('continue')} onPress={() => setStep(1)} />
          </>
        )}

        {step === 1 && (
          <>
            <T v="display" style={{ marginTop: S.md }}>
              {t('welcomeNamesTitle')}
            </T>
            <T v="body" color={C.textSoft} style={{ marginTop: S.sm }}>
              {t('welcomeNamesBody')}
            </T>
            <View style={{ marginTop: S.xxl, gap: S.lg }}>
              <Field label={t('partnerOne')} value={nameA} onChangeText={setNameA} placeholder={t('namePlaceholder')} />
              <Field label={t('partnerTwo')} value={nameB} onChangeText={setNameB} placeholder={t('namePlaceholder')} />
            </View>
            <View style={{ flex: 1 }} />
            <Row gap={S.sm}>
              <Button kind="secondary" label={t('back')} onPress={() => setStep(0)} style={{ flex: 1 }} />
              <Button label={t('continue')} onPress={saveNames} disabled={!nameA.trim() || !nameB.trim() } style={{ flex: 2 }} />
            </Row>
          </>
        )}

        {step === 2 && (
          <>
            <T v="display" style={{ marginTop: S.md }}>
              {t('welcomeWhoTitle')}
            </T>
            <T v="body" color={C.textSoft} style={{ marginTop: S.sm }}>
              {t('welcomeWhoBody')}
            </T>
            <View style={{ marginTop: S.xxl, gap: S.md }}>
              {(['a', 'b'] as MemberId[]).map((m) => {
                const name = m === 'a' ? nameA : nameB;
                return (
                  <Pressable key={m} onPress={() => choose(m)} style={[styles.option, { flexDirection: d.row, gap: S.md, borderColor: memberColor(m) + '55' }]}>
                    <Avatar member={m} label={name} size={44} />
                    <T v="title" style={{ flex: 1 }}>
                      {name}
                    </T>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flex: 1 }} />
            <Button kind="secondary" label={t('back')} onPress={() => setStep(1)} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  wrap: { flex: 1, padding: S.gutter, paddingTop: S.xxl },
  option: {
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.lg,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.surface,
  },
  optionActive: { borderColor: C.accent, backgroundColor: C.accentSoft },
});
