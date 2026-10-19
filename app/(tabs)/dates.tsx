import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { useApp, DateCategory } from '../../context/AppContext';

const Icon = (Comp: any, props: { size?: number; color?: string; style?: any }) => {
  const { color, ...rest } = props;
  return React.createElement(Comp, { stroke: color, color, ...rest });
};

const CATEGORY_MAP: Record<DateCategory, { label: string; icon: string; color: string }> = {
  food: { label: 'מסעדות וברים', icon: '🍽️', color: '#EF4444' },
  home: { label: 'ערב בבית', icon: '🎬', color: '#8B5CF6' },
  outdoor: { label: 'חוויות בחוץ', icon: '🏕️', color: '#10B981' },
};

const BUILT_IN_IDEAS: { title: string; category: DateCategory; note: string }[] = [
  { title: 'פיקניק שקיעה בחוף הים', category: 'outdoor', note: 'להביא יין, גבינות ומוזיקה' },
  { title: 'ערב קוקטיילים ביתי', category: 'home', note: 'קונים שייקר, קרח וממציאים משקה' },
  { title: 'טורניר משחקי קופסה / קלפים', category: 'home', note: 'המפסיד מכין ארוחת בוקר' },
  { title: 'בר יין נעים בעיר', category: 'food', note: 'לשתות כוס יין ונשנוש איכותי' },
  { title: 'סדנת פיצה ביתית מהבצק', category: 'home', note: 'התפחה, רוטב טרי וטופינגס מושחתים' },
  { title: 'נסיעה לגלידרייה בלילה', category: 'food', note: 'לשבת באוטו או בטיילת עם גלידה' },
  { title: 'מסלול הליכה קליל בטבע', category: 'outdoor', note: 'תרמוס קפה ונעלי ספורט' },
  { title: 'ערב ספא וסרט ביתי', category: 'home', note: 'נרות, מסיכות פנים וסרט טוב' },
];

export default function DatesScreen() {
  const {
    dateIdeas,
    addDateIdea,
    toggleDateIdea,
    deleteDateIdea,
    chores,
    dailyNote,
    updateDailyNote,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dates' | 'house'>('dates');
  const [filterCategory, setFilterCategory] = useState<'all' | DateCategory>('all');

  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedCat, setSelectedCat] = useState<DateCategory>('food');

  const [randomModalVisible, setRandomModalVisible] = useState(false);
  const [pickedIdea, setPickedIdea] = useState<{ title: string; category: DateCategory; note?: string; isCustom?: boolean } | null>(null);

  const [editingNote, setEditingNote] = useState(dailyNote);
  const [isEditingNote, setIsEditingNote] = useState(false);

  const handleRollRoulette = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const userUncompleted = dateIdeas.filter((i) => !i.isCompleted).map((i) => ({
      title: i.title,
      category: i.category,
      note: i.note,
      isCustom: true,
    }));

    const builtIns = BUILT_IN_IDEAS.map((i) => ({ ...i, isCustom: false }));
    const combinedPool = [...userUncompleted, ...builtIns];
    const randomIndex = Math.floor(Math.random() * combinedPool.length);

    setPickedIdea(combinedPool[randomIndex]);
    setRandomModalVisible(true);
  };

  const handleAddIdea = async () => {
    if (!newTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addDateIdea(newTitle, selectedCat, newNote);
    setNewTitle('');
    setNewNote('');
  };

  const handleSaveNote = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateDailyNote(editingNote);
    setIsEditingNote(false);
  };

  const completedChoresCount = chores.filter((c) => c.isCompleted).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'dates' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('dates');
            }}
          >
            {Icon(LucideIcons.Sparkles, { size: 16, color: activeTab === 'dates' ? '#FFF' : Colors.subtext })}
            <Text style={[styles.segmentText, activeTab === 'dates' && styles.segmentTextActive]}>
              דייטים ופינוקים ✨
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'house' && styles.segmentBtnActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('house');
            }}
          >
            {Icon(LucideIcons.HeartHandshake, { size: 16, color: activeTab === 'house' ? '#FFF' : Colors.subtext })}
            <Text style={[styles.segmentText, activeTab === 'house' && styles.segmentTextActive]}>
              מרכז הבית ❤️
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'dates' ? (
          <>
            <View style={styles.rouletteCard}>
              <View style={styles.rouletteTextCol}>
                <Text style={styles.rouletteTitle}>מתלבטים מה לעשות? 🎲</Text>
                <Text style={styles.rouletteSub}>הגרלה מהרשימה שלכם + רעיונות השראה מפתיעים</Text>
              </View>
              <TouchableOpacity style={styles.rouletteBtn} onPress={handleRollRoulette}>
                {Icon(LucideIcons.Dices, { size: 18, color: '#FFF' })}
                <Text style={styles.rouletteBtnText}>הגרל דייט!</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
                  onPress={() => setFilterCategory('all')}
                >
                  <Text style={[styles.filterText, filterCategory === 'all' && styles.filterTextActive]}>
                    הכל ({dateIdeas.length})
                  </Text>
                </TouchableOpacity>

                {(Object.keys(CATEGORY_MAP) as DateCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text style={[styles.filterText, filterCategory === cat && styles.filterTextActive]}>
                      {CATEGORY_MAP[cat].icon} {CATEGORY_MAP[cat].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.glassInputCard}>
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[styles.addBtn, !newTitle.trim() && styles.addBtnDisabled]}
                  onPress={handleAddIdea}
                  disabled={!newTitle.trim()}
                >
                  {Icon(LucideIcons.Plus, { size: 20, color: '#FFF' })}
                </TouchableOpacity>

                <TextInput
                  style={styles.mainInput}
                  placeholder="רעיון לדייט או מסעדה (למשל: סושי, בר יין)"
                  placeholderTextColor={Colors.subtext}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  onSubmitEditing={handleAddIdea}
                  returnKeyType="done"
                />
              </View>

              <TextInput
                style={[styles.mainInput, { marginTop: 8 }]}
                placeholder="הערה / מנה מומלצת (אופציונלי)"
                placeholderTextColor={Colors.subtext}
                value={newNote}
                onChangeText={setNewNote}
              />

              <View style={styles.catPickerRow}>
                {(Object.keys(CATEGORY_MAP) as DateCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catSelectBtn,
                      selectedCat === cat && { borderColor: CATEGORY_MAP[cat].color, backgroundColor: `${CATEGORY_MAP[cat].color}20` },
                    ]}
                    onPress={() => setSelectedCat(cat)}
                  >
                    <Text
                      style={[
                        styles.catSelectText,
                        selectedCat === cat && { color: CATEGORY_MAP[cat].color, fontWeight: '700' },
                      ]}
                    >
                      {CATEGORY_MAP[cat].icon} {CATEGORY_MAP[cat].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FlatList
              data={dateIdeas.filter((i) => filterCategory === 'all' || i.category === filterCategory)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const catInfo = CATEGORY_MAP[item.category];
                return (
                  <View style={[styles.itemCard, item.isCompleted && styles.itemCardCompleted]}>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteDateIdea(item.id)}>
                      {Icon(LucideIcons.Trash2, { size: 16, color: Colors.textMuted })}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.itemTitleCol}
                      onPress={() => toggleDateIdea(item.id, item.isCompleted)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.itemTitle, item.isCompleted && styles.itemTitleCompleted]}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 13 }}>{catInfo.icon}</Text>
                      </View>
                      {item.note ? <Text style={styles.metaText}>💡 {item.note}</Text> : null}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.checkSquare, item.isCompleted && styles.checkSquareActive]}
                      onPress={() => toggleDateIdea(item.id, item.isCompleted)}
                    >
                      {item.isCompleted ? Icon(LucideIcons.Check, { color: '#FFF', size: 14 }) : null}
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>✨</Text>
                  <Text style={styles.emptyTitle}>אין רעיונות בקטגוריה זו</Text>
                  <Text style={styles.emptySub}>הוסיפו מקומות וחוויות שבא לכם לנסות</Text>
                </View>
              }
            />
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.houseContent}>
            <View style={styles.loveNoteCard}>
              <View style={styles.loveNoteHeader}>
                {Icon(LucideIcons.Heart, { size: 18, color: '#EC4899' })}
                <Text style={styles.loveNoteTitle}>פתק יומי משותף 💌</Text>
              </View>

              {isEditingNote ? (
                <View style={{ width: '100%' }}>
                  <TextInput
                    style={styles.noteEditInput}
                    multiline
                    value={editingNote}
                    onChangeText={setEditingNote}
                    placeholder="השאר/י פתק מתוק..."
                    placeholderTextColor={Colors.subtext}
                  />
                  <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveNote}>
                    <Text style={styles.saveNoteBtnText}>שמור פתק לכולם</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.noteDisplayArea}
                  onPress={() => {
                    setEditingNote(dailyNote);
                    setIsEditingNote(true);
                  }}
                >
                  <Text style={styles.noteDisplayText}>
                    {dailyNote ? `"${dailyNote}"` : 'לחצו כאן כדי להשאיר פתק יומי מתוק... ✨'}
                  </Text>
                  <Text style={styles.noteHint}>לחץ לעריכה ✏️</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.statsCard}>
              {Icon(LucideIcons.Award, { size: 28, color: Colors.secondary })}
              <View style={styles.statTextCol}>
                <Text style={styles.statTitle}>עבודת צוות בבית 🤝</Text>
                <Text style={styles.statSub}>
                  יש כרגע <Text style={{ fontWeight: '800', color: Colors.primary }}>{chores.length}</Text> מטלות פעילות.
                  ביחד סגרתם <Text style={{ fontWeight: '800', color: Colors.primary }}>{completedChoresCount}</Text> משימות!
                </Text>
              </View>
            </View>

            <View style={styles.syncCard}>
              <View style={styles.syncHeader}>
                {Icon(LucideIcons.Wifi, { size: 16, color: Colors.primary })}
                <Text style={styles.syncTitle}>סנכרון ענן חי</Text>
              </View>
              <Text style={styles.syncDesc}>קוד הבית המשותף מסונכרן אוטומטית בזמן אמת ב-Firestore:</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>HOMESYNC-772</Text>
              </View>
            </View>
          </ScrollView>
        )}

        <Modal
          visible={randomModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRandomModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rouletteCardModal}>
              <View style={{ alignItems: 'center', gap: 6, marginBottom: 16 }}>
                {Icon(LucideIcons.Sparkles, { size: 26, color: Colors.secondary })}
                <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text }}>הפור נפל!</Text>
              </View>

              {pickedIdea && (
                <View style={styles.pickedContainer}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>{CATEGORY_MAP[pickedIdea.category].icon}</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' }}>
                    {pickedIdea.title}
                  </Text>
                  {pickedIdea.note ? (
                    <Text style={{ fontSize: 12, color: Colors.subtext, marginTop: 6, textAlign: 'center' }}>
                      💡 {pickedIdea.note}
                    </Text>
                  ) : null}
                  <View style={styles.badgeSource}>
                    <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700' }}>
                      {pickedIdea.isCustom ? '⭐ מהרשימה שלכם' : '✨ רעיון השראה מהאפליקציה'}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.closeRouletteBtn} onPress={() => setRandomModalVisible(false)}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>יאללה, זורמים על זה! ❤️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  rouletteCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  rouletteTextCol: { flex: 1, paddingRight: 8, alignItems: 'flex-end' },
  rouletteTitle: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  rouletteSub: { fontSize: 11, color: Colors.subtext, marginTop: 2, textAlign: 'right' },
  rouletteBtn: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rouletteBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
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
    gap: 8,
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
  catPickerRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 4 },
  catSelectBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.glassInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catSelectText: { fontSize: 11, color: Colors.subtext },
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
  itemCardCompleted: { opacity: 0.5 },
  itemTitleCol: { flex: 1, paddingHorizontal: 10, alignItems: 'flex-end' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  itemTitleCompleted: { textDecorationLine: 'line-through', color: Colors.subtext },
  metaText: { fontSize: 11, color: Colors.subtext, marginTop: 2 },
  checkSquare: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glassInput,
  },
  checkSquareActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  deleteBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.subtext, marginTop: 4 },
  houseContent: { padding: 16, gap: 14 },
  loveNoteCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
    alignItems: 'flex-end',
  },
  loveNoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  loveNoteTitle: { fontSize: 14, fontWeight: '700', color: '#F472B6' },
  noteDisplayArea: { width: '100%', paddingVertical: 6 },
  noteDisplayText: { fontSize: 14, color: '#FBCFE8', textAlign: 'right', fontStyle: 'italic', lineHeight: 22 },
  noteHint: { fontSize: 11, color: '#DB2777', marginTop: 6, textAlign: 'right' },
  noteEditInput: {
    backgroundColor: Colors.glassInput,
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  saveNoteBtn: {
    backgroundColor: '#EC4899',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveNoteBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  statTextCol: { flex: 1, alignItems: 'flex-end' },
  statTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  statSub: { fontSize: 12, color: Colors.subtext, textAlign: 'right', lineHeight: 18 },
  syncCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-end',
  },
  syncHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  syncTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  syncDesc: { fontSize: 12, color: Colors.subtext, textAlign: 'right', lineHeight: 18, marginBottom: 12 },
  codeContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  codeText: { fontSize: 16, fontWeight: '800', color: Colors.primary, letterSpacing: 1.5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  rouletteCardModal: {
    backgroundColor: '#11131A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickedContainer: {
    alignItems: 'center',
    backgroundColor: Colors.glassInput,
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeSource: {
    marginTop: 10,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  closeRouletteBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
});