import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { missionAPI, photoAPI, BASE_URL } from '../services/api';
import { formatKstMMDD, kstDateKey } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';

// 재사용 컴포넌트 (네가 쓰던 거 그대로)
import Header from '../ui/Header';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { theme } from '../ui/theme';

// ===== 토큰(공용 theme 기반 + 브랜드 컬러만 오버라이드) =====
const colors = {
  ...theme.colors,
  primary: '#7C3AED',
  primaryAlt: '#EC4899',
  success: '#22C55E',
} as const;
const { spacing, typography } = theme;
const radii = { ...theme.radii, xl: 24 } as const;
// 최근 항목 개수(필요 시 숫자만 바꾸면 됨)
const RECENT_LIMIT = 3;

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

type RecentItem = { date: string; image: string; mission: string; mood?: string };

const HomeScreen = React.memo(() => {
  const navigation = useNavigation<HomeNav>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [todayMission, setTodayMission] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');
  const [todayMissionObj, setTodayMissionObj] = useState<any | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [totalPhotos, setTotalPhotos] = useState<number>(0);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const containerInsetsStyle = useMemo(() => ({ paddingBottom: 0 }), []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [mission, myPhotos, myRecents] = await Promise.all([
        missionAPI.getTodayMission(),
        photoAPI.getMyPhotos(),
        photoAPI.getMyRecentPhotos(RECENT_LIMIT),
      ]);

      // 오늘의 미션
  setTodayMission(mission?.title || '오늘의 미션');
  setTodayMissionObj(mission || null);
  const md = mission?.date ? new Date(mission.date) : new Date();
  setTodayDate(formatKstMMDD(md));

      // 통계 계산
  const toKey = (d: Date) => kstDateKey(d);
      const dateKeys = new Set<string>();
      (myPhotos || []).forEach((p: any) => {
        const ds = p?.missionId?.date; // 미션 날짜 기준으로만 계산
        if (ds) dateKeys.add(toKey(new Date(ds)));
      });
      setTotalPhotos((myPhotos || []).length);
      // 연속 달성 계산(오늘부터 과거로 연속 촬영일 수)
      let cnt = 0;
      const cur = new Date();
      cur.setHours(0, 0, 0, 0);
      while (dateKeys.has(toKey(cur))) {
        cnt += 1;
        cur.setDate(cur.getDate() - 1);
      }
      setStreak(cnt);

      // 최근 3개
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
      console.error('미션 로드 실패:', e);
      Alert.alert('오류', '오늘의 미션을 불러오는데 실패했습니다.');
      setTodayMission('오늘의 미션');
      setRecents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 포커스 시마다 최신화
  useEffect(() => {
    if (isFocused) {
      loadData();
    }
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
  <SafeAreaView style={[styles.container, containerInsetsStyle]} edges={[]}> 
      {/* 상단 헤더: 네가 쓰던 컴포넌트 */}
      <Header title="오늘의 미션" />

      {/* 본문 */}
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* 인사 */}
        <View style={styles.helloWrap}>
          <Text style={styles.helloTitle}>안녕하세요, {user?.nickname || '친구'}님!</Text>
          <Text style={styles.helloSub}>오늘의 미션을 완성해보세요</Text>
        </View>

        {/* 오늘의 미션 카드 (Card 활용) */}
        <Card style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.rowCenter}>
              <View style={styles.dot} />
              <Text style={styles.cardBadge}>오늘의 미션</Text>
            </View>
            <Text style={styles.cardDate}>{todayDate}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>미션을 불러오는 중...</Text>
            </View>
          ) : (
            <Text style={styles.missionTitle}>{todayMission}</Text>
          )}

      {/* 미션 이미지(있을 때만 표시) */}
      {Boolean((todayMissionObj as any)?.imageUrl) && (
            <View style={styles.heroWrap}>
              <Image
        source={{ uri: String((todayMissionObj as any).imageUrl).startsWith('http') ? (todayMissionObj as any).imageUrl : `${BASE_URL}${(todayMissionObj as any).imageUrl}` }}
                style={styles.hero}
                resizeMode="cover"
              />
            </View>
          )}

          <Button
            title="📸 사진 찍기"
            onPress={() => navigation.navigate('Camera')}
            disabled={loading}
            style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl }}
          />
        </Card>

        {/* 통계 그리드 (간단 카드 두 개) */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{streak}</Text>
            <Text style={styles.statLabel}>연속 달성</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primaryAlt }]}>{totalPhotos}</Text>
            <Text style={styles.statLabel}>총 미션</Text>
          </Card>
        </View>

        {/* 최근 사진들 */}
        <View style={styles.recentWrap}>
          <Text style={styles.sectionTitle}>최근 사진들</Text>
          {recents.map((r, i) => (
            <Card key={i} style={styles.recentItem}>
              <View style={styles.recentTopRow}>
                <Text style={styles.recentDate}>{r.date}</Text>
                <View style={styles.recentDot} />
              </View>
              <View style={styles.recentImageWrap}>
                <Image source={{ uri: r.image }} style={styles.recentImage} resizeMode="cover" />
              </View>
              {/* 미션 박스 (보라색) */}
              <View style={styles.recentMissionBox}>
                <View style={styles.missionRow}> 
                  <View style={styles.missionDot} />
                  <Text style={styles.missionLabel}>오늘의 미션</Text>
                </View>
                <Text style={styles.missionText}>{r.mission}</Text>
              </View>

              {/* 감정 박스 (핑크색) */}
              <View style={styles.recentMoodBox}>
                <View style={styles.moodRow}> 
                  <View style={styles.moodDot} />
                  <Text style={styles.moodLabel}>감정</Text>
                </View>
                <Text style={styles.moodText}>{r.mood || '메모 없음'}</Text>
              </View>
            </Card>
          ))}
          {recents.length === 0 && !loading && (
            <Text style={[styles.recentText, { textAlign: 'center', color: colors.subText }]}>아직 업로드된 사진이 없어요.</Text>
          )}
        </View>

  {/* 하단 여유 패딩 제거로 바텀바 위 여백 최소화 */}
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollBody: {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  },
  helloWrap: { marginBottom: spacing.lg },
  helloTitle: { fontSize: typography.h1, fontWeight: '800', color: colors.text, marginBottom: 6 },
  helloSub: { fontSize: typography.body, color: colors.subText },

  card: {
  borderRadius: radii.xl,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 },
  cardBadge: { fontSize: typography.small, color: colors.subText, fontWeight: '600' },
  cardDate: { fontSize: typography.small, color: '#9CA3AF' },
  missionTitle: { fontSize: typography.h2, color: colors.text, fontWeight: '800', lineHeight: 26 },

  loadingBox: { alignItems: 'center', paddingVertical: spacing.md },
  loadingText: { marginTop: spacing.md, color: colors.subText, fontSize: typography.body, textAlign: 'center' },

  heroWrap: { borderRadius: radii.lg, overflow: 'hidden', marginTop: spacing.lg },
  hero: { width: '100%', height: 192 },

  statsGrid: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  statCard: { flex: 1, borderRadius: radii.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: typography.small, color: colors.subText },

  recentWrap: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  recentItem: { borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.lg },
  recentTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  recentDate: { fontSize: typography.small, color: colors.subText },
  recentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C4B5FD' },
  recentImageWrap: { borderRadius: radii.md, overflow: 'hidden', marginBottom: spacing.sm },
  recentImage: { width: '100%', height: 192 },
  tag: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  recentText: { fontSize: 14, color: colors.subText },

  // Feed 스타일과 맞춘 보라/핑크 박스들
  recentMissionBox: { backgroundColor: '#F5F3FF', marginTop: spacing.sm, marginBottom: spacing.xs, borderRadius: 16, padding: spacing.sm },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  missionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 },
  missionLabel: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  missionText: { fontSize: 16, color: colors.text, fontWeight: '700' },

  recentMoodBox: { backgroundColor: '#FEF2F2', marginTop: spacing.xs, borderRadius: 16, padding: spacing.sm },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryAlt, marginRight: 6 },
  moodLabel: { fontSize: 12, color: colors.primaryAlt, fontWeight: '700' },
  moodText: { fontSize: 14, color: '#374151' },
});

export default HomeScreen;
