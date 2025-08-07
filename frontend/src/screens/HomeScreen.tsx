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
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 미션</Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
    color: '#2c3e50',
  },
  missionCard: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 280,
    alignItems: 'center',
  },
  missionText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#2c3e50',
    fontWeight: '600',
    lineHeight: 28,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 10,
  },
  cameraButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  cameraButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default HomeScreen;
