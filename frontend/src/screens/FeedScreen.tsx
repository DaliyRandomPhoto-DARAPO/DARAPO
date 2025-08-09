import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import Header from '../ui/Header';
import EmptyState from '../ui/EmptyState';
import { colors, typography, spacing } from '../ui/theme';
import Button from '../ui/Button';
import { useNavigation } from '@react-navigation/native';

const FeedScreen = () => {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([] as any[]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    // TODO: API 호출로 피드 데이터 로드
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

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

      <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.lg }}>
        <EmptyState title="아직 올라온 사진이 없어요" subtitle={'첫 번째 미션을 완료하고\n사진을 공유해보세요!'} />
        <Button title="📸 지금 찍으러 가기" onPress={() => navigation.navigate('Camera')} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
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
