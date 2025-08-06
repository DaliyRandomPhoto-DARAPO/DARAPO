import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { missionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout } = useAuth();
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

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 미션</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.missionCard}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>미션을 불러오는 중...</Text>
          </View>
        ) : (
          <View style={styles.missionCard}>
            <Text style={styles.missionText}>{todayMission}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.cameraButton, loading && styles.disabledButton]}
          onPress={() => navigation.navigate('Camera')}
          disabled={loading}
        >
          <Text style={styles.cameraButtonText}>📸 사진 찍기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  missionCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 250,
    alignItems: 'center',
  },
  missionText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#555',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
