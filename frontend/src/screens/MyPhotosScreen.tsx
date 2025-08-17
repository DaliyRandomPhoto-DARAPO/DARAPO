import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, FlatList, View, Image, Text, RefreshControl, Pressable, Platform } from 'react-native';
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

const CONTENT_MAX_WIDTH = 720;

const MyPhotosScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const normalizeUri = useCallback((u?: string) => {
    if (!u) return undefined;
    if (u.startsWith('http')) return u;
    return `${BASE_URL.replace(/\/$/, '')}/${u.replace(/^\//, '')}`;
  }, []);

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

  const Separator = useCallback(() => <View style={{ height: spacing.md }} />, []);
  const ListFooter = useMemo(
    () => <View style={{ height: insets.bottom + spacing.xl }} />,
    [insets.bottom]
  );

  const renderItem = useCallback(({ item }: { item: PhotoItem }) => {
    const missionTitle = item?.missionId?.title || '오늘의 미션';
    const dateStr = item?.createdAt ? formatKstMMDD(item.createdAt) : '';
    return (
      <View style={{ alignSelf: 'center', width: '100%', maxWidth: CONTENT_MAX_WIDTH }}>
        <Card style={styles.card}>
          {/* 상단: 날짜 + 설정 이동 */}
          <View style={styles.postHeader}>
            {!!dateStr && <Text style={styles.date}>{dateStr}</Text>}
            <View style={{ flex: 1 }} />
            <Pressable
              style={styles.moreBtn}
              accessibilityLabel="설정"
              hitSlop={8}
              onPress={() =>
                navigation.navigate('PhotoSettings', {
                  photoId: item._id,
                  isPublic: item.isPublic,
                  imageUrl: item.imageUrl,
                  missionTitle,
                  comment: item.comment,
                })
              }
            >
              <Text style={{ color: '#9CA3AF' }}>⋯</Text>
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
  }, [navigation, normalizeUri]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="내 사진 보기" />
      {(!loading && photos.length === 0) ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
          <EmptyState title="아직 업로드한 사진이 없어요" subtitle={'오늘의 미션을 완료하고\n첫 사진을 올려보세요!'} />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xl }]}
          ItemSeparatorComponent={Separator}
          ListFooterComponent={ListFooter}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : 'never'}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  date: { fontSize: 12, lineHeight: 16, color: colors.subText, fontWeight: '500' },
  moreBtn: { padding: 6 },

  imageWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 0 },
  image: { width: '100%', aspectRatio: 1, borderRadius: radii.lg },

  missionBox: {
    backgroundColor: '#F5F3FF',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  missionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 },
  missionLabel: { fontSize: 12, lineHeight: 16, color: colors.primary, fontWeight: '600' },
  missionText: { fontSize: 16, lineHeight: 20, color: colors.text, fontWeight: '700' },

  moodBox: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.md,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryAlt, marginRight: 6 },
  moodLabel: { fontSize: 12, lineHeight: 16, color: colors.primaryAlt, fontWeight: '600' },
  moodText: { fontSize: 14, lineHeight: 18, color: '#374151' },
});

export default MyPhotosScreen;
