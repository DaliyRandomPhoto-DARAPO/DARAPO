import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { missionAPI } from '../services/api';
import Header from '../ui/Header';
import Card from '../ui/Card';
import Button from '../ui/Button';

// Local tokens
const colors = { background: '#f8f9fa', text: '#2c3e50', subText: '#7f8c8d', primary: '#3498db' } as const;
const spacing = { sm: 8, md: 12, lg: 16, xl: 24 } as const;
const typography = { h2: 20, body: 16 } as const;

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const HomeScreen = React.memo(() => {
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  paddingHorizontal: spacing.xl,
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
