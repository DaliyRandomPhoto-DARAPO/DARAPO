import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { missionAPI } from '../services/api';
import Header from '../ui/Header';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { colors, spacing, typography } from '../ui/theme';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [todayMission, setTodayMission] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayMission();
  }, []);

  const loadTodayMission = async () => {
    try {
      setLoading(true);
      const mission = await missionAPI.getTodayMission();
      setTodayMission(mission.title);
    } catch (error) {
      console.error('미션 로드 실패:', error);
      Alert.alert('오류', '오늘의 미션을 불러오는데 실패했습니다.');
      setTodayMission('오늘의 미션'); // 기본값
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="오늘의 미션" />
      
      <View style={styles.content}>
        <Card style={styles.cardWidth}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>미션을 불러오는 중...</Text>
            </View>
          ) : (
            <Text style={styles.missionText}>{todayMission}</Text>
          )}
        </Card>

        <Button
          title="📸 사진 찍기"
          onPress={() => navigation.navigate('Camera')}
          disabled={loading}
          style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl }}
        />
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
  },
  cardWidth: { minWidth: 280, alignItems: 'center' },
  loadingBox: { alignItems: 'center' },
  missionText: {
    fontSize: typography.h2,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '600',
    lineHeight: 28,
  },
  loadingText: {
    fontSize: typography.body,
    textAlign: 'center',
    color: colors.subText,
    marginTop: spacing.md,
  },
});

export default HomeScreen;
