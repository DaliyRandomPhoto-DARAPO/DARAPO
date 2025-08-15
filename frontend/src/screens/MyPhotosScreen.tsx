import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, Image, Text, Alert, RefreshControl, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Card from '../ui/Card';
import { theme } from '../ui/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// Shared theme with minor overrides to match app
const colors = { ...theme.colors, primary: '#7C3AED', primaryAlt: '#EC4899' } as const;
const { spacing, typography, radii } = theme;
import { photoAPI, BASE_URL } from '../services/api';
import { formatKstMMDD } from '../utils/date';

type PhotoItem = {
  _id: string;
  imageUrl: string; // e.g., /uploads/xxx.jpg
  comment?: string;
  isPublic?: boolean;
  createdAt?: string;
  missionId?: { title?: string } | null;
};

const MyPhotosScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await photoAPI.getMyPhotos();
      setPhotos(list || []);
    } catch (e) {
      console.error('내 사진 로드 실패', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const confirmDelete = (id: string) => {
    Alert.alert('삭제', '이 사진을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => handleDelete(id) },
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await photoAPI.deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      Alert.alert('오류', '삭제에 실패했습니다.');
    }
  };

  const togglePublic = async (item: PhotoItem) => {
    try {
      const updated = await photoAPI.updatePhoto(item._id, { isPublic: !item.isPublic });
      setPhotos((prev) => prev.map((p) => (p._id === item._id ? { ...p, isPublic: updated.isPublic } : p)));
    } catch (e) {
      Alert.alert('오류', '공개 설정 변경 실패');
    }
  };

  const toMMDD = (d: Date) => formatKstMMDD(d);

  const renderItem = ({ item }: { item: PhotoItem }) => {
  const missionTitle = item?.missionId?.title || '오늘의 미션';
  const dateStr = item?.createdAt ? formatKstMMDD(item.createdAt) : '';
    return (
      <Card style={styles.card}>
        {/* 상단: 날짜만 표시, 설정은 별도 화면으로 */}
        <View style={styles.postHeader}>
          {!!dateStr && <Text style={styles.date}>{dateStr}</Text>}
          <View style={{ flex: 1 }} />
          <Pressable
            style={styles.moreBtn}
            accessibilityLabel="설정"
            onPress={() => navigation.navigate('PhotoSettings', {
              photoId: item._id,
              isPublic: item.isPublic,
              imageUrl: item.imageUrl,
              missionTitle,
              comment: item.comment,
            })}
          >
            <Text style={{ color: '#9CA3AF' }}>⋯</Text>
          </Pressable>
        </View>

        {/* 사진 */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: item.imageUrl?.startsWith('http') ? item.imageUrl : `${BASE_URL}${item.imageUrl}` }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* 미션 박스 (보라) */}
        <View style={styles.missionBox}>
          <View style={styles.missionRow}>
            <View style={styles.missionDot} />
            <Text style={styles.missionLabel}>오늘의 미션</Text>
          </View>
          <Text style={styles.missionText}>{missionTitle}</Text>
        </View>

        {/* 감정 박스 (핑크) */}
        {!!item.comment && (
          <View style={styles.moodBox}>
            <View style={styles.moodRow}>
              <View style={styles.moodDot} />
              <Text style={styles.moodLabel}>감정</Text>
            </View>
            <Text style={styles.moodText}>{item.comment}</Text>
          </View>
        )}

  {/* 설정은 별도 화면에서 처리 */}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
  <Header title="내 사진 보기" />
    {(!loading && photos.length === 0) ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <EmptyState title="아직 업로드한 사진이 없어요" subtitle={'오늘의 미션을 완료하고\n첫 사진을 올려보세요!'} />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    rowGap: spacing.md, // gap 호환성 보조
  },

  // Card: 원본 그대로 유지
  card: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.xs,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  avatar: { width: '100%', height: '100%' },
  userName: { fontSize: 14, lineHeight: 18, color: colors.text, fontWeight: '700' },
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

  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  publicLabel: { fontSize: typography.body, lineHeight: typography.body + 4, color: colors.text },

  settingsPanel: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    rowGap: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    rowGap: spacing.sm,
  },
});

export default MyPhotosScreen;
