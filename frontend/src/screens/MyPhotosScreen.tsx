import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, FlatList, View, Image, Text, Alert, RefreshControl } from 'react-native';
import Header from '../ui/Header';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { colors, spacing, typography } from '../ui/theme';
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
    <View style={styles.card}>
      <Image source={{ uri: `${BASE_URL}${item.imageUrl}` }} style={styles.photo} />
      {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
      <View style={styles.row}>
        <Button
          title={item.isPublic ? '비공개로 전환' : '공개로 전환'}
          onPress={() => togglePublic(item)}
          variant="outline"
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button title="삭제" onPress={() => confirmDelete(item._id)} variant="danger" style={{ flex: 1 }} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="내 사진 관리" />
      {(!loading && photos.length === 0) ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <EmptyState title="아직 업로드한 사진이 없어요" subtitle={'오늘의 미션을 완료하고\n첫 사진을 올려보세요!'} />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 220,
  },
  comment: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});

export default MyPhotosScreen;
