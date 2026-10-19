import React from 'react';
import { Platform, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { CheckCircle2, Heart, ShoppingBasket, UtensilsCrossed, Wallet } from 'lucide-react-native';
import { C } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export default function TabLayout() {
  const { ready, me, t } = useApp();

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!me) return <Redirect href="/welcome" />;

  const icon =
    (Comp: typeof ShoppingBasket) =>
    ({ color, focused }: { color: string; focused: boolean }) =>
      <Comp color={color} size={22} strokeWidth={focused ? 2.2 : 1.7} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.textFaint,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.hairline,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabShopping'), tabBarIcon: icon(ShoppingBasket) }} />
      <Tabs.Screen name="chores" options={{ title: t('tabChores'), tabBarIcon: icon(CheckCircle2) }} />
      <Tabs.Screen name="money" options={{ title: t('tabMoney'), tabBarIcon: icon(Wallet) }} />
      <Tabs.Screen name="meals" options={{ title: t('tabMeals'), tabBarIcon: icon(UtensilsCrossed) }} />
      <Tabs.Screen name="dates" options={{ title: t('tabUs'), tabBarIcon: icon(Heart) }} />
    </Tabs>
  );
}
