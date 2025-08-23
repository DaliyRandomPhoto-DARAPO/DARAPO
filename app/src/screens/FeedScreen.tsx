import React, { memo, useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, FlatList } from 'react-native';
import Header from '../ui/Header';
import Card from '../ui/Card';
import MissionInfo from '../ui/MissionInfo';
import type { Mission } from '../types/mission';
import { photoAPI, missionAPI, BASE_URL } from '../services/api';
import { normalizeMission } from '../utils/mission';
import { theme } from '../ui/theme';
import { formatKstMMDD } from '../utils/date';

// 공용 theme + 브랜드 컬러 오버라이드
const colors = {
  ...theme.colors,
  primary2: '#3498db',
  primary: '#7C3AED',
  primaryAlt: '#EC4899',
  grayIcon: '#6B7280',
  red: '#EF4444',
} as const;
const { spacing, typography } = theme;
const radii = { ...theme.radii, xl: 24, full: 999 } as const;

const tabs = ['오늘의 미션', '전체 미션'] as const;

type Tab = typeof tabs[number];

type FeedItem = {
  id: string;
  user: { name: string; avatar?: string | null };
  date: string;
  mission: string;
  missionObj?: Mission | undefined;
  image: string;
  likes: number;
  mood?: string;
  liked?: boolean;
};

const PAGE_SIZE = 10;

const FeedScreen = memo(() => {
  
  const [active, setActive] = useState<Tab>('오늘의 미션');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const handleSelectTab = useCallback((t: Tab) => {
    if (t === active) return;
    // 즉시 시각적 피드백과 로딩 상태 초기화
    setActive(t);
    setItems([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  }, [active]);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const toMMDD = (d: Date) => formatKstMMDD(d);

  const mapPhotoToItem = (p: any): FeedItem => {
    const ds = p?.missionId?.date || p?.createdAt;
  const d = ds ? new Date(ds) : new Date();
    const rawImage: string = p?.imageUrl || '';
    const image = rawImage.startsWith('http') ? rawImage : `${BASE_URL}${rawImage}`;
    const userName: string = p?.userId?.nickname || '익명';
    const rawAvatar: string | null = p?.userId?.profileImage || null;
    const avatar = rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${BASE_URL}${rawAvatar}`) : null;
    const missionTitle: string = p?.missionId?.title || '오늘의 미션';
  const missionObj: Mission | undefined = normalizeMission(p?.missionId) as Mission | undefined;
    const mood: string | undefined = p?.comment || undefined;
    return {
      id: String(p?._id || ''),
      user: { name: userName, avatar },
  date: formatKstMMDD(d),
      mission: missionTitle,
      missionObj,
      image,
      likes: 0,
      mood,
      liked: false,
    };
  };

  const loadInitial = async () => {
    try {
      setLoading(true);
  if (active === '오늘의 미션') {
  const mission = await missionAPI.getTodayMission();
  const photos = mission?._id ? await photoAPI.getPhotosByMission?.(mission._id) : [];
  // normalize mission for later use
  const normMission = normalizeMission(mission);
        const mapped = (photos || []).map(mapPhotoToItem);
        setItems(mapped);
        setPage(0);
        setHasMore(false);
      } else {
        const photos = await photoAPI.getPublicPhotos(PAGE_SIZE, 0);
        const mapped = (photos || []).map(mapPhotoToItem);
        setItems(mapped);
        setPage(1);
        setHasMore((photos || []).length === PAGE_SIZE);
      }
    } catch (e) {
      console.error('피드 로드 실패:', e);
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      if (active === '오늘의 미션') {
        const mission = await missionAPI.getTodayMission();
        const photos = mission?._id ? await photoAPI.getPhotosByMission?.(mission._id) : [];
        const mapped = (photos || []).map(mapPhotoToItem);
        setItems(mapped);
        setPage(0);
        setHasMore(false);
      } else {
        const photos = await photoAPI.getPublicPhotos(PAGE_SIZE, 0);
        const mapped = (photos || []).map(mapPhotoToItem);
        setItems(mapped);
        setPage(1);
        setHasMore((photos || []).length === PAGE_SIZE);
      }
    } catch (e) {
      console.error('피드 갱신 실패:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (active === '오늘의 미션') return;
    if (!hasMore || loading || refreshing || loadingMore) return;
    try {
      setLoadingMore(true);
      const skip = page * PAGE_SIZE;
      const photos = await photoAPI.getPublicPhotos(PAGE_SIZE, skip);
      const mapped = (photos || []).map(mapPhotoToItem);
      setItems(prev => [...prev, ...mapped]);
      setPage(prev => prev + 1);
      setHasMore((photos || []).length === PAGE_SIZE);
    } catch (e) {
      console.error('추가 로드 실패:', e);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleLike = useCallback((id: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const liked = !it.liked;
      const likes = Math.max(0, (it.likes || 0) + (liked ? 1 : -1));
      return { ...it, liked, likes };
    }));
  }, []);

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    const p = item;
    return (
      <Card style={styles.postCard}>
        {/* 상단 유저/날짜 */}
        <View style={styles.postHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {p.user.avatar ? (
              <View style={styles.avatarWrap}>
                <Image source={{ uri: p.user.avatar }} style={styles.avatar} />
              </View>
            ) : (
              <View style={[styles.avatarWrap, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: '#6B7280', fontWeight: '700' }}>{p.user.name.charAt(0)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{p.user.name}</Text>
              <Text style={styles.date}>{p.date}</Text>
            </View>
          </View>
          <Pressable style={styles.moreBtn} accessibilityLabel="더보기"><Text style={{ color: '#9CA3AF' }}>⋯</Text></Pressable>
        </View>

        {/* 오늘의 미션 박스 */}
        <View style={styles.missionBox}>
          <View style={styles.missionRow}>
            <View style={styles.missionDot} />
            <Text style={styles.missionLabel}>오늘의 미션</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <MissionInfo mission={p.missionObj} compact />
              </View>
              {/* rare badge */}
              {p.missionObj?.isRare ? (
                <View style={{ marginLeft: 8, backgroundColor: '#FDE68A', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '800' }}>Rare</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* 사진 */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: p.image }} style={styles.image} resizeMode="cover" />
        </View>

        {/* 감정 박스 */}
        {!!p.mood && (
          <View style={styles.moodBox}>
            <View style={styles.moodRow}>
              <View style={styles.moodDot} />
              <Text style={styles.moodLabel}>감정</Text>
            </View>
            <Text style={styles.moodText}>{p.mood}</Text>
          </View>
        )}
      </Card>
    );
  }, [handleToggleLike]);

  return (
  <SafeAreaView style={styles.safe} edges={[]}>
      <Header title="피드" />

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.listHeaderWrap}>
            {/* 탭 필터 */}
            <View style={styles.tabWrap}>
              <View style={styles.tabPill}>
                {tabs.map(t => (
                  <Pressable key={t} onPress={() => handleSelectTab(t)} hitSlop={10} style={[styles.tabBtn, active === t && styles.tabBtnActive]} accessibilityRole="button" accessibilityState={{ selected: active === t }}>
                    <Text style={[styles.tabLabel, active === t && styles.tabLabelActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {loading && items.length === 0 && (
              <View style={{ paddingVertical: spacing.xl }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ textAlign: 'center', marginTop: spacing.md, color: colors.subText }}>피드를 불러오는 중...</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingVertical: spacing.xl }}>
              <Text style={{ textAlign: 'center', color: colors.subText }}>아직 공개된 사진이 없어요.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <View style={{ paddingVertical: spacing.lg }}>
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={{ textAlign: 'center', color: colors.subText }}>아래로 스크롤하면 더 불러와요</Text>
              )}
            </View>
          ) : (
            items.length > 0 ? <View style={{ paddingVertical: spacing.md }}><Text style={{ textAlign: 'center', color: colors.subText }}>끝까지 봤어요</Text></View> : null
          )
        }
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.2}
        onEndReached={loadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingTop: spacing.sm, paddingHorizontal: spacing.sm, paddingBottom: 0 },
  listHeaderWrap: {},

  tabWrap: { marginBottom: spacing.lg },
  tabPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    padding: 6,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  tabBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 999 },
  tabBtnActive: { backgroundColor: colors.primary2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  tabLabel: { color: colors.subText, fontWeight: '600', fontSize: typography.body },
  tabLabelActive: { color: '#fff' },

  postCard: { padding: 0, marginBottom: spacing.lg},
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm, paddingBottom: spacing.xs },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.xs, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  avatar: { width: '100%', height: '100%' },
  userName: { fontSize: 14, color: colors.text, fontWeight: '700' },
  date: { fontSize: 12, color: colors.subText },
  moreBtn: { padding: 6 },

  missionBox: { backgroundColor: '#F5F3FF', margin: spacing.sm, borderRadius: 16, padding: spacing.sm },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  missionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 },
  missionLabel: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  missionText: { fontSize: 14, color: colors.text, fontWeight: '700' },

  imageWrap: { width: '100%', aspectRatio: 1, marginTop: spacing.sm, paddingHorizontal: spacing.sm },
  image: { width: '100%', height: '100%', borderRadius: radii.lg },

  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 4 },
  actionIcon: { fontSize: 18, color: colors.grayIcon },
  actionCount: { fontSize: 13, color: '#374151', fontWeight: '600', marginLeft: 4 },

  moodBox: { backgroundColor: '#FEF2F2', margin: spacing.sm, borderRadius: 16, padding: spacing.sm },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryAlt, marginRight: 6 },
  moodLabel: { fontSize: 12, color: colors.primaryAlt, fontWeight: '700' },
  moodText: { fontSize: 13, color: '#374151' },
});

export default FeedScreen;
