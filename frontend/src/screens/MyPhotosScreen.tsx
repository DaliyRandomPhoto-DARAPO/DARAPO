import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { StyleSheet, FlatList, View, Image, Text, RefreshControl, Pressable, Platform, type ListRenderItemInfo } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import EmptyState from '../ui/EmptyState';
import Card from '../ui/Card';
import { theme } from '../ui/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { photoAPI, BASE_URL } from '../services/api';
import { formatKstMMDD } from '../utils/date';

const colors = { ...theme.colors, primary: '#7C3AED', primaryAlt: '#EC4899' } as const;
const { spacing, radii } = theme;

type PhotoItem = {
  _id: string;
  imageUrl: string;
  comment?: string;
  isPublic?: boolean;
  createdAt?: string;
  missionId?: { title?: string } | null;
};

const CONTENT_MAX_WIDTH = 720 as const;

// ------- 유틸(참조 고정) -------
const normalizeUri = (u?: string) =>
  !u ? undefined : u.startsWith('http') ? u : `${BASE_URL.replace(/\/$/, '')}/${String(u).replace(/^\//, '')}`;

// ------- 아이템 카드 (memo) -------
const PhotoCard = memo(function PhotoCard({
  item,
  onPressSettings,
}: {
  item: PhotoItem;
  onPressSettings: (it: PhotoItem) => void;
}) {
  const missionTitle = item?.missionId?.title || '오늘의 미션';
  const dateStr = item?.createdAt ? formatKstMMDD(item.createdAt) : '';

  return (
    <View style={styles.centeredRow}>
      <Card style={styles.card}>
        {/* 상단: 날짜 + 설정 이동 */}
        <View style={styles.postHeader}>
          {!!dateStr && <Text style={styles.date}>{dateStr}</Text>}
          <View style={styles.flex1} />
          <Pressable
            style={styles.moreBtn}
            accessibilityLabel="설정"
            hitSlop={HIT_SLOP_8}
            onPress={() => onPressSettings(item)}
          >
            <Text style={styles.moreText}>⋯</Text>
          </Pressable>
        </View>

        {/* 사진 */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: normalizeUri(item.imageUrl) }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* 미션 박스 */}
        <View style={styles.missionBox}>
          <View style={styles.missionRow}>
            <View style={styles.missionDot} />
            <Text style={styles.missionLabel}>오늘의 미션</Text>
          </View>
          <Text style={styles.missionText}>{missionTitle}</Text>
        </View>

        {/* 감정 박스 */}
        {!!item.comment && (
          <View style={styles.moodBox}>
            <View style={styles.moodRow}>
              <View style={styles.moodDot} />
              <Text style={styles.moodLabel}>감정</Text>
            </View>
            <Text style={styles.moodText}>{item.comment}</Text>
          </View>
        )}
      </Card>
    </View>
  );
}, (a, b) => {
  // 필요한 필드만 비교 (불필요 리렌더 차단)
  const x = a.item, y = b.item;
  return (
    x._id === y._id &&
    x.imageUrl === y.imageUrl &&
    x.comment === y.comment &&
    x.isPublic === y.isPublic &&
    x.createdAt === y.createdAt &&
    (x.missionId?.title ?? '') === (y.missionId?.title ?? '')
  ) && a.onPressSettings === b.onPressSettings;
});

// ------- 상수 -------
const HIT_SLOP_8 = 8 as const;

const MyPhotosScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await photoAPI.getMyPhotos();
      setPhotos(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 설정 화면에서 돌아오면 자동 리프레시
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const contentPadBottom = useMemo(() => insets.bottom + spacing.xl, [insets.bottom]);

  const Separator = useCallback(() => <View style={styles.separator} />, []);
  const ListFooter = useMemo(() => <View style={{ height: contentPadBottom }} />, [contentPadBottom]);

  const onPressSettings = useCallback((it: PhotoItem) => {
    const missionTitle = it?.missionId?.title || '오늘의 미션';
    navigation.navigate('PhotoSettings', {
      photoId: it._id,
      isPublic: it.isPublic,
      imageUrl: it.imageUrl,
      missionTitle,
      comment: it.comment,
    });
  }, [navigation]);

  const keyExtractor = useCallback((item: PhotoItem) => item._id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PhotoItem>) => (
      <PhotoCard item={item} onPressSettings={onPressSettings} />
    ),
    [onPressSettings]
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="내 사진 보기" />
      <FlatList
        data={photos}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.listContent, { paddingBottom: contentPadBottom }]}
        ItemSeparatorComponent={Separator}
        ListFooterComponent={ListFooter}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        // 퍼포먼스 튜닝
        initialNumToRender={6}
        windowSize={7}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.emptyWrap, { paddingBottom: contentPadBottom }]}>
              <EmptyState title="아직 업로드한 사진이 없어요" subtitle={'오늘의 미션을 완료하고\n첫 사진을 올려보세요!'} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  separator: { height: spacing.md },

  centeredRow: { alignSelf: 'center', width: '100%', maxWidth: CONTENT_MAX_WIDTH },

  card: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  date: { fontSize: 12, lineHeight: 16, color: colors.subText, fontWeight: '500' },
  moreBtn: { padding: 6 },
  moreText: { color: '#9CA3AF' },
  flex1: { flex: 1 },

  imageWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 0 },
  image: { width: '100%', aspectRatio: 1, borderRadius: radii.lg },

  missionBox: {
    backgroundColor: '#F5F3FF',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,        // spacing.md → spacing.sm
    borderRadius: 12,             // 16 → 12 (조금 더 컴팩트)
    padding: spacing.sm,          // spacing.md → spacing.sm
  },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 }, // 4 → 2
  missionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 4 }, // 조금 작게
  missionLabel: { fontSize: 11, lineHeight: 14, color: colors.primary, fontWeight: '600' },
  missionText: { fontSize: 13, lineHeight: 18, color: colors.text, fontWeight: '700' },

  moodBox: {
      backgroundColor: '#FEF2F2',
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,       // spacing.md → spacing.sm
      borderRadius: 12,            // 16 → 12
      padding: spacing.sm,         // spacing.md → spacing.sm
      marginBottom: spacing.sm,    // spacing.md → spacing.sm
    },
    moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 }, // 4 → 2
    moodDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryAlt, marginRight: 4 },
    moodLabel: { fontSize: 11, lineHeight: 14, color: colors.primaryAlt, fontWeight: '600' },
    moodText: { fontSize: 12, lineHeight: 17, color: '#374151' },

  emptyWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
});

export default MyPhotosScreen;
