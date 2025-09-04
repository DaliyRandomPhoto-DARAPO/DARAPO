import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { missionAPI, photoAPI, BASE_URL } from '../services/api';
import { normalizeMission } from '../utils/mission';
import { formatKstMMDD, kstDateKey } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';

import Header from '../ui/Header';
import Card from '../ui/Card';
import MissionInfo from '../ui/MissionInfo';
import type { Mission } from '../types/mission';
import Button from '../ui/Button';
import { theme } from '../ui/theme';

const baseColors = {
  ...theme.colors,
  primary: '#7C3AED',
  primaryAlt: '#EC4899',
  success: '#22C55E',
} as const;

const { spacing, typography } = theme;
const radii = { ...theme.radii, xl: 24 } as const;
const RECENT_LIMIT = 3;

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
type RecentItem = { date: string; image: string; mission: string; mood?: string };

const HomeScreen = memo(() => {
  const navigation = useNavigation<HomeNav>();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  // 라이트 테마 고정값만 씀
  const colors = useMemo(
    () => ({
      ...baseColors,
      subtleBg: '#F9FAFB',
      outline: '#E6E8EC',
      purpleBoxBg: '#F5F3FF',
      purpleBoxBorder: '#E9E5FF',
      pinkBoxBg: '#FEF2F2',
      pinkBoxBorder: '#FCE2E2',
      skeletonBg: '#EEF0F3',
    }),
    []
  );

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [todayMission, setTodayMission] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');
  const [todayMissionObj, setTodayMissionObj] = useState<Mission | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [totalPhotos, setTotalPhotos] = useState<number>(0);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const containerInsetsStyle = useMemo(() => ({ paddingBottom: 0 }), []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // 미션/사진은 독립적으로 받아서 한쪽 실패가 다른 쪽을 막지 않도록 함
      const [missionRes, photosRes] = await Promise.allSettled([
        missionAPI.getTodayMission(),
        photoAPI.getMyPhotos(),
      ]);

      const mission: any = missionRes.status === 'fulfilled' ? missionRes.value : undefined;
      const myPhotos: any[] = photosRes.status === 'fulfilled' ? (photosRes.value || []) : [];

      const norm = normalizeMission(mission);
      setTodayMission(norm?.title || '오늘의 미션');
      setTodayMissionObj(norm || null);
      const md = mission?.date ? new Date(mission.date) : new Date();
      setTodayDate(formatKstMMDD(md));

      const toKey = (d: Date) => kstDateKey(d);
      const dateKeys = new Set<string>();
      (myPhotos || []).forEach((p: any) => {
        const ds = p?.missionId?.date;
        if (ds) dateKeys.add(toKey(new Date(ds)));
      });
      setTotalPhotos((myPhotos || []).length);

      let cnt = 0;
      const cur = new Date();
      cur.setHours(0, 0, 0, 0);
      while (dateKeys.has(toKey(cur))) {
        cnt += 1;
        cur.setDate(cur.getDate() - 1);
      }
      setStreak(cnt);

      // 최근 사진은 별도로 처리하여 실패해도 앱이 동작하도록
      let myRecents: any[] = [];
      try {
        myRecents = await photoAPI.getMyRecentPhotos(RECENT_LIMIT);
      } catch (recentError) {
        console.warn('Recent photos load failed, using fallback:', recentError);
        // 전체 사진에서 최신 3개 추출
        myRecents = (myPhotos || []).slice(0, RECENT_LIMIT);
      }

      const recentItems: RecentItem[] = (myRecents || []).map((p: any) => {
        const ds = p?.missionId?.date || p?.createdAt;
        const d = ds ? new Date(ds) : new Date();
        const dateStr = formatKstMMDD(d);
        const rawUrl: string = p?.imageUrl || '';
        const image = rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl}`;
        const missionTitle: string = p?.missionId?.title || '오늘의 미션';
        const mood: string | undefined = p?.comment || undefined;
        return { date: dateStr, image, mission: missionTitle, mood };
      });
      setRecents(recentItems);
    } catch (e) {
      console.warn('Data loading failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return (
    // Header가 내부에서 top safe-area(insets.top)를 처리하므로 여기서는 top 제외
    <SafeAreaView style={[styles.container, containerInsetsStyle]} edges={['left', 'right', 'bottom']}>
      <Header title="오늘의 미션" />

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.subtleBg}
          />
        }
      >
        {/* 인사 */}
        <View style={styles.helloWrap}>
          <Text style={styles.helloTitle}>안녕하세요, {user?.nickname || '친구'}님!</Text>
          <Text style={styles.helloSub}>오늘의 미션을 완성해보세요</Text>
        </View>

      <Card style={[styles.card, styles.elevated]}>
        <View style={styles.cardTopRow}>
          <View style={styles.rowCenter}>
            <View style={styles.dot} />
            <Text style={styles.cardBadge}>오늘의 미션</Text>
          </View>
          <Text style={styles.cardDate}>{todayDate}</Text>
        </View>

        {/* 이 블록으로 묶어서 가운데 정렬 */}
        <View style={styles.cardBodyCenter}>
          {loading ? (
                <Skeleton lines={1} height={28} radius={8} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <MissionInfo mission={todayMissionObj} center showDescription hideMeta />
                </View>
              )}

          {!!todayMissionObj?.imageUrl && (
            <View style={styles.heroWrap}>
              <Image
                source={{
                  uri: String(todayMissionObj.imageUrl).startsWith('http')
                    ? todayMissionObj.imageUrl as string
                    : `${BASE_URL}${String(todayMissionObj.imageUrl)}`,
                }}
                style={styles.hero}
                resizeMode="cover"
              />
            </View>
          )}

          <Button
            title="📸 사진 찍기"
            onPress={() => navigation.navigate('Camera')}
            disabled={loading}
            style={styles.cta}
          />
        </View>
      </Card>


        {/* 통계 */}
        <View style={styles.statsGrid}>
          <StatCard label="연속 달성" value={String(streak)} valueColor={colors.primary} />
          <StatCard label="총 미션" value={String(totalPhotos)} valueColor={colors.primaryAlt} />
        </View>

        {/* 최근 */}
        <View style={styles.recentWrap}>
          <Text style={styles.sectionTitle}>최근 사진들</Text>

          {!loading && recents.length === 0 ? (
            <Text style={[styles.recentText, styles.centerText]}>아직 업로드된 사진이 없어요.</Text>
          ) : null}

          {loading ? (
            <View style={{ gap: spacing.md }}>
              <Skeleton height={220} radius={16} />
              <Skeleton height={220} radius={16} />
            </View>
          ) : (
            recents.map((r, i) => <RecentCard key={`${r.image}-${i}`} item={r} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  // Card에 접근성 prop 안 꽂음 (타입 충돌 방지)
  return (
    <Card style={[styles.statCard, styles.elevatedSm]}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const RecentCard = memo(({ item }: { item: RecentItem }) => {
  return (
    <Card style={[styles.recentItem, styles.elevatedSm]}>
      <View style={styles.recentTopRow}>
        <Text style={styles.recentDate}>{item.date}</Text>
        <View style={styles.recentDot} />
      </View>

      <View style={styles.recentImageWrap}>
        <Image source={{ uri: item.image }} style={styles.recentImage} resizeMode="cover" />
      </View>

      <View style={styles.recentMissionBox}>
        <View style={styles.missionRow}>
          <View style={styles.missionDot} />
          <Text style={styles.missionLabel}>오늘의 미션</Text>
        </View>
        <Text style={styles.missionText}>{item.mission}</Text>
      </View>

      <View style={styles.recentMoodBox}>
        <View style={styles.moodRow}>
          <View style={styles.moodDot} />
          <Text style={styles.moodLabel}>감정</Text>
        </View>
        <Text style={styles.moodText}>{item.mood || '메모 없음'}</Text>
      </View>
    </Card>
  );
});

function Skeleton({
  lines = 1,
  height = 16,
  radius = 8,
}: {
  lines?: number;
  height?: number;
  radius?: number;
}) {
  return (
    <View style={{ gap: 8, marginVertical: 6 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={[styles.skeleton, { height, borderRadius: radius }]} />
      ))}
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 2 },
});

const shadowSm = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 1 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.background,
  },
  scrollBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  paddingBottom: 0,
  },

  cardBodyCenter: {
    alignItems: 'center',
  },

  // greeting
  helloWrap: { marginBottom: spacing.lg },
  helloTitle: { fontSize: typography.h1, fontWeight: '800', color: baseColors.text, marginBottom: 6 },
  helloSub: { fontSize: typography.body, color: baseColors.subText },

  // card
  card: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E8EC',
    marginBottom: spacing.xl,
    backgroundColor: baseColors.surface,
  },
  elevated: { ...(shadow as object) },
  elevatedSm: { ...(shadowSm as object) },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: baseColors.success, marginRight: 6 },
  cardBadge: { fontSize: typography.small, color: baseColors.subText, fontWeight: '600' },
  cardDate: { fontSize: typography.small, color: '#9CA3AF' },
  missionTitle: { fontSize: typography.h2, color: baseColors.text, fontWeight: '800', lineHeight: 26,  textAlign: 'center', alignSelf: 'center' },

  heroWrap: { borderRadius: radii.lg, overflow: 'hidden', marginTop: spacing.lg, backgroundColor: '#F9FAFB', alignSelf: 'stretch' },
  hero: { width: '100%', aspectRatio: 16 / 9 },

  cta: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 48, alignSelf: 'center' },

  // stats
  statsGrid: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  statCard: { flex: 1, borderRadius: radii.lg, paddingVertical: spacing.lg, alignItems: 'center', backgroundColor: baseColors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E6E8EC' },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: typography.small, color: baseColors.subText },

  // recents
  recentWrap: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: baseColors.text, marginBottom: spacing.md },
  recentItem: { borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg, backgroundColor: baseColors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E6E8EC', overflow: 'hidden' },
  recentTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  recentDate: { fontSize: typography.small, color: baseColors.subText },
  recentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C4B5FD' },
  recentImageWrap: { borderRadius: radii.md, overflow: 'hidden', marginBottom: spacing.sm, backgroundColor: '#F9FAFB' },
  recentImage: { width: '100%', aspectRatio: 4 / 3 },

  recentText: { fontSize: 14, color: baseColors.subText },
  centerText: { textAlign: 'center' },

  recentMissionBox: { backgroundColor: '#F5F3FF', marginTop: spacing.xs, marginBottom: spacing.sm, borderRadius: 12, padding: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E9E5FF' },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  missionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: baseColors.primary, marginRight: 6 },
  missionLabel: { fontSize: 11, color: baseColors.primary, fontWeight: '600' },
  missionText: { fontSize: 13, color: baseColors.text, fontWeight: '700', marginLeft: 3 },

  recentMoodBox: { backgroundColor: '#FEF2F2', marginTop: spacing.xs, borderRadius: 12, padding: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FCE2E2', marginBottom: spacing.xs },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  moodDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: baseColors.primaryAlt, marginRight: 6 },
  moodLabel: { fontSize: 11, color: baseColors.primaryAlt, fontWeight: '600' },
  moodText: { fontSize: 13, color: baseColors.text, marginLeft: 3 },

  // skeleton
  skeleton: {
    width: '100%',
    backgroundColor: '#EEF0F3',
    overflow: 'hidden',
  },
});

function makeStyles(colors: any) {
  // 위에서 바로 styles 객체에 baseColors/고정값 써서,
  // 여기선 타입만 맞추려고 남겨둠. 필요하면 colors 활용해서 확장.
  return StyleSheet.create(styles as any);
}

export default HomeScreen;
