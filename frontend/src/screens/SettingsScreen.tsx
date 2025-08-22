import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../services/api';

// Local tokens
const colors = { background: '#f8f9fa', surface: '#ffffff', text: '#2c3e50' } as const;
const spacing = { md: 12, lg: 16 } as const;
const typography = { body: 16 } as const;
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState(true);
  const { logout, token } = useAuth();
  const [leaving, setLeaving] = useState(false);

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
              Alert.alert('로그아웃 오류', '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleLeave = async () => {
    Alert.alert(
      '탈퇴하기',
      '정말로 회원 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              const resp = await fetch(`${BASE_URL}/api/user/me`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (resp.ok) {
                Alert.alert('탈퇴 완료', '정상적으로 탈퇴되었습니다.');
                await logout();
              } else {
                Alert.alert('탈퇴 실패', '탈퇴 중 오류가 발생했습니다.');
              }
            } catch (e) {
              Alert.alert('탈퇴 실패', '네트워크 오류로 탈퇴에 실패했습니다.');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="설정" />

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>푸시 알림</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.link}>이용약관</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Privacy')}>
          <Text style={styles.link}>개인정보처리방침</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: spacing.lg, marginHorizontal: spacing.lg }}>
        <TouchableOpacity style={[styles.row, { flex: 1, backgroundColor: '#ffeded', borderRadius: 8, justifyContent: 'center' }]} onPress={handleLeave} disabled={leaving}>
          <Text style={[styles.label, { color: '#e74c3c', textAlign: 'center' }]}>탈퇴하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { flex: 1, backgroundColor: '#ffecec', borderRadius: 8, justifyContent: 'center' }]} onPress={handleLogout}>
          <Text style={[styles.label, { color: '#c0392b', textAlign: 'center' }]}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: typography.body, color: colors.text },
  link: { fontSize: typography.body, color: colors.text },
  arrow: { fontSize: 20, color: '#bdc3c7' },
});

export default SettingsScreen;
