import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, Image, Text, Alert, RefreshControl, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Card from '../ui/Card';
import { theme } from '../ui/theme';

// Shared theme with minor overrides to match app
const colors = { ...theme.colors, primary: '#7C3AED', primaryAlt: '#EC4899' } as const;
const { spacing, typography, radii } = theme;
import { photoAPI, BASE_URL } from '../services/api';

type PhotoItem = {
  _id: string;
  imageUrl: string; // e.g., /uploads/xxx.jpg
  comment?: string;
  isPublic?: boolean;
  createdAt?: string;
};

const MyPhotosScreen = () => {
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

  const renderItem = ({ item }: { item: PhotoItem }) => (
    <Card style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: item.imageUrl?.startsWith('http') ? item.imageUrl : `${BASE_URL}${item.imageUrl}` }}
          style={styles.photo}
          resizeMode="cover"
        />
      </View>

      {!!item.comment && (
        <View style={styles.moodBox}>
          <View style={styles.moodRow}>
            <View style={styles.moodDot} />
            <Text style={styles.moodLabel}>감정</Text>
          </View>
          <Text style={styles.moodText}>{item.comment}</Text>
        </View>
      )}

      <View style={styles.publicRow}>
        <Text style={styles.publicLabel}>피드에 공개</Text>
        <Switch value={!!item.isPublic} onValueChange={() => togglePublic(item)} />
      </View>

      <View style={styles.actions}>
        <Button title="삭제" onPress={() => confirmDelete(item._id)} variant="danger" size="lg" fullWidth />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="내 사진 관리" />
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
  listContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  card: { padding: 0, overflow: 'hidden' },
  imageWrap: { padding: spacing.md, paddingBottom: 0 },
  photo: { width: '100%', height: 220, borderRadius: radii.lg },
  moodBox: { backgroundColor: '#FEF2F2', marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: 16, padding: spacing.md },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryAlt, marginRight: 6 },
  moodLabel: { fontSize: 12, color: colors.primaryAlt, fontWeight: '700' },
  moodText: { fontSize: 14, color: '#374151' },
  publicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  publicLabel: { fontSize: typography.body, color: colors.text },
  actions: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});

export default MyPhotosScreen;
