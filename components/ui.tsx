// Shared UI kit. Direction-aware: every row/text flips for Hebrew without native RTL reloads.
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, X } from 'lucide-react-native';
import { C, F, R, S } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { Assignee, MemberId } from '../lib/types';

// ---------- direction ----------
export function useDir() {
  const { rtl } = useApp();
  return {
    rtl,
    row: (rtl ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
    textAlign: (rtl ? 'right' : 'left') as 'right' | 'left',
    start: (rtl ? 'flex-end' : 'flex-start') as 'flex-end' | 'flex-start',
    end: (rtl ? 'flex-start' : 'flex-end') as 'flex-end' | 'flex-start',
    writingDirection: (rtl ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  };
}

export const tap = () => Haptics.selectionAsync().catch(() => {});
export const thud = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

// ---------- text ----------
type Variant = keyof typeof F;
export function T({
  v = 'body',
  color = C.text,
  style,
  center,
  numberOfLines,
  children,
}: {
  v?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  center?: boolean;
  numberOfLines?: number;
  children: React.ReactNode;
}) {
  const d = useDir();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        F[v],
        { color, textAlign: center ? 'center' : d.textAlign, writingDirection: d.writingDirection },
        (v === 'number' || v === 'title') && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Row({ children, style, gap = S.sm }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  const d = useDir();
  return <View style={[{ flexDirection: d.row, alignItems: 'center', gap }, style]}>{children}</View>;
}

// ---------- screen ----------
export function Screen({
  title,
  overline,
  right,
  children,
  scroll = true,
  contentStyle,
}: {
  title: string;
  overline?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const header = (
    <View style={styles.header}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          {overline ? (
            <T v="small" color={C.textMuted}>
              {overline}
            </T>
          ) : null}
          <T v="display">{title}</T>
        </View>
        {right}
      </Row>
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scroll, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>
            {header}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Small round avatar of the current user, opens settings. */
export function ProfileButton() {
  const { me, memberName } = useApp();
  const name = me ? memberName(me) : '?';
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push('/settings');
      }}
      hitSlop={10}
    >
      <Avatar member={me || 'a'} label={name} size={36} />
    </Pressable>
  );
}

export function Avatar({ member, label, size = 28 }: { member: Assignee; label: string; size?: number }) {
  const color = memberColor(member);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: memberSoft(member),
        borderWidth: 1,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontWeight: '700', fontSize: size * 0.42 }}>{(label || '?').trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export const memberColor = (m: Assignee) => (m === 'a' ? C.memberA : m === 'b' ? C.memberB : C.both);
export const memberSoft = (m: Assignee) => (m === 'a' ? C.memberASoft : m === 'b' ? C.memberBSoft : C.bothSoft);

// ---------- layout blocks ----------
export function Section({
  label,
  action,
  children,
  style,
}: {
  label?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginTop: S.xxl }, style]}>
      {label || action ? (
        <Row style={{ justifyContent: 'space-between', marginBottom: S.sm, paddingHorizontal: S.gutter }}>
          {label ? (
            <T v="label" color={C.textMuted}>
              {label.toUpperCase()}
            </T>
          ) : (
            <View />
          )}
          {action}
        </Row>
      ) : null}
      {children}
    </View>
  );
}

export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: S.lg }, style]}>{children}</View>;
}

/** Grouped list: rows separated by hairlines inside one card. */
export function List({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.card, style]}>
      {items.map((child, i) => (
        <View key={i} style={i > 0 ? styles.divider : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  onLongPress,
  muted,
  strike,
}: {
  title: string;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  muted?: boolean;
  strike?: boolean;
}) {
  const d = useDir();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      style={({ pressed }) => [styles.listRow, { flexDirection: d.row }, pressed && { backgroundColor: C.raised }]}
    >
      {leading}
      <View style={{ flex: 1 }}>
        <T
          v="body"
          color={muted ? C.textMuted : C.text}
          style={strike ? { textDecorationLine: 'line-through' } : undefined}
          numberOfLines={2}
        >
          {title}
        </T>
        {typeof subtitle === 'string' ? (
          <T v="small" color={C.textMuted} numberOfLines={2}>
            {subtitle}
          </T>
        ) : (
          subtitle
        )}
      </View>
      {trailing}
    </Pressable>
  );
}

export function Empty({ title, body, icon }: { title: string; body?: string; icon?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 32, gap: 6 }}>
      {icon}
      <T v="heading" center>
        {title}
      </T>
      {body ? (
        <T v="small" color={C.textMuted} center>
          {body}
        </T>
      ) : null}
    </View>
  );
}

// ---------- controls ----------
export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const d = useDir();
  const bg = kind === 'primary' ? C.accent : kind === 'secondary' ? C.raised : kind === 'danger' ? C.dangerSoft : 'transparent';
  const fg = kind === 'primary' ? C.onAccent : kind === 'danger' ? C.danger : kind === 'ghost' ? C.accent : C.text;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && { height: 36, paddingHorizontal: 14 },
        { backgroundColor: bg, flexDirection: d.row, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        kind === 'secondary' && { borderWidth: 1, borderColor: C.hairline },
        style,
      ]}
    >
      {icon}
      <Text style={[F.bodyStrong, { color: fg, fontSize: small ? 14 : 15 }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  onPress,
  children,
  style,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: C.raised }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color = C.accent,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  color?: string;
  icon?: React.ReactNode;
}) {
  const d = useDir();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.chip,
        { flexDirection: d.row },
        active && { backgroundColor: color + '22', borderColor: color },
      ]}
    >
      {icon}
      <Text style={[F.small, { color: active ? color : C.textSoft, fontWeight: active ? '600' : '500' }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children, scroll }: { children: React.ReactNode; scroll?: boolean }) {
  const d = useDir();
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: d.row, gap: S.sm, paddingHorizontal: S.gutter, flexGrow: 1 }}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: d.row, flexWrap: 'wrap', gap: S.sm }}>{children}</View>;
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const d = useDir();
  return (
    <View style={[styles.segmented, { flexDirection: d.row }, style]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              tap();
              onChange(o.key);
            }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[F.small, { color: active ? C.text : C.textMuted, fontWeight: active ? '600' : '500' }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field(props: TextInputProps & { label?: string; style?: StyleProp<TextStyle> }) {
  const d = useDir();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <T v="label" color={C.textMuted}>
          {label.toUpperCase()}
        </T>
      ) : null}
      <TextInput
        placeholderTextColor={C.textFaint}
        selectionColor={C.accent}
        {...rest}
        style={[styles.field, { textAlign: d.textAlign, writingDirection: d.writingDirection }, style]}
      />
    </View>
  );
}

export function CheckCircle({ checked, color = C.accent, onPress, size = 24 }: { checked: boolean; color?: string; onPress?: () => void; size?: number }) {
  return (
    <Pressable
      hitSlop={10}
      onPress={onPress}
      onLongPress={undefined}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: checked ? color : C.textFaint,
        backgroundColor: checked ? color : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <Check size={size * 0.6} color={C.onAccent} strokeWidth={3} /> : null}
    </Pressable>
  );
}

export function Bar({ value, color = C.accent, height = 6, track = C.raised }: { value: number; color?: string; height?: number; track?: string }) {
  const d = useDir();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden', flexDirection: d.row }}>
      <View style={{ width: `${pct}%`, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

/** Bottom sheet built on Modal. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + S.lg }]}>
          <View style={styles.grabber} />
          <Row style={{ justifyContent: 'space-between', marginBottom: S.lg }}>
            <T v="title" style={{ flex: 1 }}>
              {title}
            </T>
            <IconButton onPress={onClose} accessibilityLabel="close">
              <X size={20} color={C.textSoft} />
            </IconButton>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const gutter = { paddingHorizontal: S.gutter };
export const inset = { marginHorizontal: S.gutter };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 48 },
  header: { paddingHorizontal: S.gutter, paddingTop: S.md, paddingBottom: S.xs },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
    marginHorizontal: S.gutter,
    overflow: 'hidden',
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline },
  listRow: { alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: 13, minHeight: 52 },
  button: { height: 46, borderRadius: R.md, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chip: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.surface,
  },
  segmented: { backgroundColor: C.surface, borderRadius: R.md, padding: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: C.hairline },
  segment: { flex: 1, height: 32, borderRadius: R.sm + 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentActive: { backgroundColor: C.raised },
  field: {
    backgroundColor: C.sunken,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.hairline,
    color: C.text,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 15,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    paddingHorizontal: S.gutter,
    paddingTop: S.sm,
    maxHeight: '88%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairlineStrong,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: C.hairlineStrong, marginBottom: S.md },
});
