import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  LayoutAnimation,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useApp, Chore, RecurrenceType, Assignee } from '../../context/AppContext';
import {
  requestNotificationPermissions,
  scheduleChoreNotification,
} from '../../services/notifications';

const triggerSmoothAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};

const Icon = (Comp: any, props: { size?: number; color?: string; style?: any }) => {
  const { color, ...rest } = props;
  return React.createElement(Comp, { stroke: color, color, ...rest });
};

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  once: 'חד-פעמי',
  daily: 'כל יום',
  every_2_days: 'כל יומיים',
  weekly: 'שבועי',
};

const ASSIGNEE_CONFIG: Record<Assignee, { label: string; color: string; badgeBg: string }> = {
  me: { label: 'אני', color: Colors.primary, badgeBg: Colors.primaryMuted },
  partner: { label: 'היא', color: '#EC4899', badgeBg: 'rgba(236, 72, 153, 0.16)' },
  anyone: { label: 'שנינו', color: Colors.secondary, badgeBg: Colors.secondaryMuted },
};

export default function ChoresScreen() {
  const {
    chores,
    addChore,
    toggleChore,
    updateChoreAssignee,
    deleteChore,
    events,
    addEvent,
    deleteEvent,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chores' | 'calendar'>('chores');
  const [choreInput, setChoreInput] = useState('');
  const [selectedRecurrence, setSelectedRecurrence] = useState<RecurrenceType>('every_2_days');
  const [selectedAssignee, setSelectedAssignee] = useState<Assignee>('anyone');
  const [filterAssignee, setFilterAssignee] = useState<'all' | 'me' | 'partner'>('all');

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventOwner, setEventOwner] = useState<Assignee>('anyone');

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const handleAddChore = async () => {
    const title = choreInput.trim();
    if (!title) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerSmoothAnimation();
    await addChore(title, selectedRecurrence, selectedAssignee);
    setChoreInput('');

    const id = await scheduleChoreNotification(title, 8);
    if (!id) {
      Alert.alert('התראות כבויות', 'יש לאפשר התראות עבור Expo Go בהגדרות המכשיר.');
    }
  };

  const handleToggleChore = (chore: Chore) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    triggerSmoothAnimation();
    toggleChore(chore);
  };

  const handleCycleAssignee = (chore: Chore) => {
    Haptics.selectionAsync();
    const cycle: Assignee[] = ['me', 'partner', 'anyone'];
    const nextIndex = (cycle.indexOf(chore.assignedTo) + 1) % cycle.length;
    updateChoreAssignee(chore.id, cycle[nextIndex]);
  };

  const handleDeleteChore = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    triggerSmoothAnimation();
    deleteChore(id);
  };

  const handleAddCalendarEvent = async () => {
    if (!eventTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerSmoothAnimation();
    await addEvent(eventTitle, eventDate || 'בקרוב', eventOwner);
    setEventTitle('');
    setEventDate('');
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    triggerSmoothAnimation();
    await deleteEvent(id);
  };

  const filteredChores = chores.filter((c) => {
    if (filterAssignee === 'all') return true;
    if (filterAssignee === 'me') return c.assignedTo === 'me' || c.assignedTo === 'anyone';
    if (filterAssignee === 'partner') return c.assignedTo === 'partner' || c.assignedTo === 'anyone';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'chores' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('chores');
            }}
          >
            {Icon(LucideIcons.CheckSquare, { size: 16, color: activeTab === 'chores' ? '#FFF' : Colors.subtext })}
            <Text style={[styles.segmentText, activeTab === 'chores' && styles.segmentTextActive]}>
              מטלות ({chores.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'calendar' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('calendar');
            }}
          >
            {Icon(LucideIcons.Calendar, { size: 16, color: activeTab === 'calendar' ? '#FFF' : Colors.subtext })}
            <Text style={[styles.segmentText, activeTab === 'calendar' && styles.segmentTextActive]}>
              לוח שנה ({events.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'chores' ? (
          <>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, filterAssignee === 'all' && styles.filterChipActive]}
                onPress={() => setFilterAssignee('all')}
              >
                <Text style={[styles.filterText, filterAssignee === 'all' && styles.filterTextActive]}>הכל</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filterAssignee === 'me' && styles.filterChipActive]}
                onPress={() => setFilterAssignee('me')}
              >
                <Text style={[styles.filterText, filterAssignee === 'me' && styles.filterTextActive]}>המשימות שלי</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filterAssignee === 'partner' && styles.filterChipActive]}
                onPress={() => setFilterAssignee('partner')}
              >
                <Text style={[styles.filterText, filterAssignee === 'partner' && styles.filterTextActive]}>של בת הזוג</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.glassInputCard}>
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[styles.addBtn, !choreInput.trim() && styles.addBtnDisabled]}
                  onPress={handleAddChore}
                  disabled={!choreInput.trim()}
                >
                  {Icon(LucideIcons.Plus, { size: 20, color: '#FFF' })}
                </TouchableOpacity>

                <TextInput
                  style={styles.mainInput}
                  placeholder="מטלה חדשה (למשל: ריקון מדיח, שטיפה...)"
                  placeholderTextColor={Colors.subtext}
                  value={choreInput}
                  onChangeText={setChoreInput}
                  onSubmitEditing={handleAddChore}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.optionsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(['every_2_days', 'daily', 'weekly', 'once'] as RecurrenceType[]).map((rec) => (
                    <TouchableOpacity
                      key={rec}
                      style={[styles.optionChip, selectedRecurrence === rec && styles.optionChipActive]}
                      onPress={() => setSelectedRecurrence(rec)}
                    >
                      {Icon(LucideIcons.RotateCw, { size: 12, color: selectedRecurrence === rec ? '#FFF' : Colors.subtext })}
                      <Text style={[styles.optionText, selectedRecurrence === rec && styles.optionTextActive]}>
                        {RECURRENCE_LABELS[rec]}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.divider} />

                  {(['anyone', 'me', 'partner'] as Assignee[]).map((asg) => (
                    <TouchableOpacity
                      key={asg}
                      style={[
                        styles.optionChip,
                        selectedAssignee === asg && {
                          backgroundColor: ASSIGNEE_CONFIG[asg].color,
                          borderColor: ASSIGNEE_CONFIG[asg].color,
                        },
                      ]}
                      onPress={() => setSelectedAssignee(asg)}
                    >
                      <Text style={[styles.optionText, selectedAssignee === asg && { color: '#FFF', fontWeight: '700' }]}>
                        {ASSIGNEE_CONFIG[asg].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <FlatList
              data={filteredChores}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const assigneeInfo = ASSIGNEE_CONFIG[item.assignedTo];
                return (
                  <View style={styles.itemCard}>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteChore(item.id)}>
                      {Icon(LucideIcons.Trash2, { size: 16, color: Colors.textMuted })}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.assigneeBadge, { backgroundColor: assigneeInfo.badgeBg }]}
                      onPress={() => handleCycleAssignee(item)}
                    >
                      <Text style={[styles.assigneeText, { color: assigneeInfo.color }]}>{assigneeInfo.label}</Text>
                    </TouchableOpacity>

                    <View style={styles.itemTitleCol}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.metaBadge}>
                          {Icon(LucideIcons.Clock, { size: 11, color: Colors.subtext })}
                          <Text style={styles.metaText}>{item.dueDate}</Text>
                        </View>
                        <View style={styles.metaBadge}>
                          {Icon(LucideIcons.RotateCw, { size: 11, color: Colors.primary })}
                          <Text style={[styles.metaText, { color: Colors.primary }]}>
                            {RECURRENCE_LABELS[item.recurrence]}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.checkSquare} onPress={() => handleToggleChore(item)}>
                      {Icon(LucideIcons.Check, { size: 14, color: Colors.primary })}
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🧹</Text>
                  <Text style={styles.emptyTitle}>הכל נקי ומסודר!</Text>
                  <Text style={styles.emptySub}>אין מטלות פעילות כרגע</Text>
                </View>
              }
            />
          </>
        ) : (
          <>
            <View style={styles.glassInputCard}>
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[styles.addBtn, !eventTitle.trim() && styles.addBtnDisabled]}
                  onPress={handleAddCalendarEvent}
                  disabled={!eventTitle.trim()}
                >
                  {Icon(LucideIcons.Plus, { size: 20, color: '#FFF' })}
                </TouchableOpacity>

                <TextInput
                  style={styles.mainInput}
                  placeholder="אירוע חדש (למשל: סרט, בדיקה, תור)"
                  placeholderTextColor={Colors.subtext}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  onSubmitEditing={handleAddCalendarEvent}
                  returnKeyType="done"
                />
              </View>

              <TextInput
                style={[styles.mainInput, { marginTop: 8 }]}
                placeholder="מועד / יום ושעה (למשל: חמישי ב-20:30)"
                placeholderTextColor={Colors.subtext}
                value={eventDate}
                onChangeText={setEventDate}
              />

              <View style={[styles.optionsRow, { justifyContent: 'flex-end', marginTop: 8 }]}>
                {(['anyone', 'me', 'partner'] as Assignee[]).map((asg) => (
                  <TouchableOpacity
                    key={asg}
                    style={[
                      styles.optionChip,
                      eventOwner === asg && {
                        backgroundColor: ASSIGNEE_CONFIG[asg].color,
                        borderColor: ASSIGNEE_CONFIG[asg].color,
                      },
                    ]}
                    onPress={() => setEventOwner(asg)}
                  >
                    <Text style={[styles.optionText, eventOwner === asg && { color: '#FFF', fontWeight: '700' }]}>
                      {ASSIGNEE_CONFIG[asg].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const ownerInfo = ASSIGNEE_CONFIG[item.owner || 'anyone'];
                return (
                  <View style={styles.itemCard}>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteCalendarEvent(item.id)}>
                      {Icon(LucideIcons.Trash2, { size: 16, color: Colors.textMuted })}
                    </TouchableOpacity>

                    <View style={styles.itemTitleCol}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.metaText}>📅 {item.date}</Text>
                    </View>

                    <View style={[styles.assigneeBadge, { backgroundColor: ownerInfo.badgeBg }]}>
                      <Text style={[styles.assigneeText, { color: ownerInfo.color }]}>{ownerInfo.label}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📆</Text>
                  <Text style={styles.emptyTitle}>אין אירועים קרובים</Text>
                  <Text style={styles.emptySub}>הוסיפו אירוע משותף כדי לתאם ביומן</Text>
                </View>
              }
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 6,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.subtext },
  segmentTextActive: { color: '#FFF' },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.subtext, fontWeight: '500' },
  filterTextActive: { color: Colors.primary, fontWeight: '700' },
  glassInputCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mainInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.glassInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    textAlign: 'right',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  optionsRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.glassInput,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  optionChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  optionText: { fontSize: 11, color: Colors.subtext },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  divider: { width: 1, height: 18, backgroundColor: Colors.border, marginHorizontal: 4 },
  listContent: { padding: 16, paddingBottom: 40 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemTitleCol: { flex: 1, paddingHorizontal: 10, alignItems: 'flex-end' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4, textAlign: 'right' },
  metaRow: { flexDirection: 'row', gap: 6 },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.glassInput,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: { fontSize: 11, color: Colors.subtext },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assigneeText: { fontSize: 11, fontWeight: '700' },
  checkSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryMuted,
  },
  deleteBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.subtext, marginTop: 4 },
});