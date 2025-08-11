import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Header from '../ui/Header';
import EmptyState from '../ui/EmptyState';
import { colors, typography, spacing } from '../ui/theme';
import Button from '../ui/Button';
import { useNavigation } from '@react-navigation/native';
import { photoAPI, BASE_URL } from '../services/api';

type PhotoItem = {
  _id: string;
  imageUrl: string; // e.g. "/uploads/abc.jpg"
  comment?: string;
  isPublic?: boolean;
  createdAt?: string;
};

const PAGE_SIZE = 20;
const GAP = spacing.md;
const NUM_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - GAP) / NUM_COLUMNS; // 좌우 패딩 + 컬럼 간격 고려

const FeedScreen = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation<any>();

  const loadPhotos = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setRefreshing(true);
        } else if (skip === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const nextSkip = reset ? 0 : skip;
        const data = await photoAPI.getPublicPhotos(PAGE_SIZE, nextSkip);

        // 데이터 없거나 마지막 페이지 체크
        const newList: PhotoItem[] = Array.isArray(data) ? data : [];
        setHasMore(newList.length === PAGE_SIZE);

        if (reset) {
          setPhotos(newList);
          setSkip(newList.length);
        } else {
          setPhotos((prev) => [...prev, ...newList]);
          setSkip((prev) => prev + newList.length);
        }
      } catch (e: any) {
        setError(e?.message || '피드를 불러오는 중 오류가 발생했어요.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [skip]
  );

  useEffect(() => {
    loadPhotos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => loadPhotos(true);
  const loadMore = () => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    loadPhotos(false);
  };

  const renderItem = ({ item }: { item: PhotoItem }) => {
    const uri = `${BASE_URL}${item.imageUrl}`;
    return (
      <View style={styles.gridItem}>
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      </View>
    );
  };

  const ListEmpty = () => (
    <View style={{ padding: spacing.lg }}>
      <EmptyState title="아직 올라온 사진이 없어요" subtitle={'첫 번째 미션을 완료하고\n사진을 공유해보세요!'} />
      <Button
        title="📸 지금 찍으러 가기"
        onPress={() => navigation.navigate('Camera')}
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="피드" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>피드를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="피드" />
    {!!error && (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
      <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      )}

      <FlatList
        data={photos}
        keyExtractor={(item) => item._id}
        numColumns={NUM_COLUMNS}
  columnWrapperStyle={{ gap: GAP, paddingHorizontal: spacing.lg }}
  contentContainerStyle={{ paddingVertical: spacing.lg, gap: GAP }}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: spacing.md }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    overflow: 'hidden',
    borderRadius: 12,
  backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.body,
    color: colors.subText,
    marginTop: 10,
  },
});

export default FeedScreen;
