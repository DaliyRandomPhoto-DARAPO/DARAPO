import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Header from '../ui/Header';
import { Image } from 'react-native';
import { BASE_URL, photoAPI } from '../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { theme } from '../ui/theme';

// Use shared theme for consistency
const colors = { ...theme.colors, primary: '#7C3AED', primaryAlt: '#EC4899' } as const;
const { spacing, typography, radii } = theme;
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useIsFocused } from '@react-navigation/native';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [uploadedCount, setUploadedCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  const isFocused = useIsFocused();
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const list: any[] = (await photoAPI.getMyPhotos()) || [];
      setUploadedCount(list.length);
      // 완료한 미션 수: 고유 미션ID 또는 미션 날짜 기준으로 집계
      const toKey = (p: any) => {
        const mid = p?.missionId?._id;
        if (mid) return `m:${String(mid)}`;
        const ds = p?.missionId?.date || p?.createdAt;
        const d = ds ? new Date(ds) : null;
        if (!d) return `d:unknown`;
        d.setHours(0, 0, 0, 0);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `d:${y}-${m}-${day}`;
      };
      const uniq = new Set<string>();
      list.forEach((p) => uniq.add(toKey(p)));
      setCompletedCount(uniq.size);
    } catch (e) {
      setUploadedCount(0);
      setCompletedCount(0);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused, loadStats]);

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('로그아웃 에러:', error);
              Alert.alert('로그아웃 오류', '로그아웃 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
  <SafeAreaView style={styles.container} edges={[]}>
      <Header title="프로필" />
      
      <ScrollView style={styles.content} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <Card style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage.startsWith('http') ? user.profileImage : `${BASE_URL}${user.profileImage}` }}
                style={{ width: '100%', height: '100%', borderRadius: 50 }}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.nickname?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <Text style={styles.nickname}>{user?.nickname || '사용자'}</Text>
        </Card>

        <Card style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{loadingStats ? '-' : completedCount}</Text>
            <Text style={styles.statLabel}>완료한 미션</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{loadingStats ? '-' : uploadedCount}</Text>
            <Text style={styles.statLabel}>업로드한 사진</Text>
          </View>
        </Card>

        <Card style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileEdit')}>
            <Text style={styles.menuText}>프로필 수정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyPhotos')}>
            <Text style={styles.menuText}>내 사진 보기</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuText}>설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.menuText}>이용약관</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.menuText}>개인정보처리방침</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        <Button title="로그아웃" onPress={handleLogout} variant="danger" size="lg" fullWidth style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
  },
  profileSection: {
  alignItems: 'center',
  paddingVertical: spacing.xl,
  marginBottom: spacing.md,
  marginTop: spacing.md,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nickname: {
    fontSize: typography.h1,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: typography.body,
    color: colors.subText,
  },
  statsSection: { flexDirection: 'row', paddingVertical: spacing.lg, marginBottom: spacing.md },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.subText,
  },
  menuSection: { marginBottom: spacing.lg },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  menuText: {
    fontSize: typography.body,
    color: colors.text,
  },
  menuArrow: {
    fontSize: 20,
    color: '#bdc3c7',
  },
  logoutButton: {
    backgroundColor: colors.danger,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: typography.body,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
