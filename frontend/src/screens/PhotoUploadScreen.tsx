import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { photoAPI, missionAPI } from '../services/api';
import Header from '../ui/Header';

// Local tokens
const colors = { background: '#f8f9fa', text: '#2c3e50', subText: '#7f8c8d', surface: '#ffffff', primary: '#3498db' } as const;
const spacing = { xl: 24, lg: 16, md: 12, sm: 8, xs: 6 } as const;
const typography = { small: 14, h2: 20, body: 16 } as const;
import Button from '../ui/Button';

type PhotoUploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoUpload'>;
type PhotoUploadScreenRouteProp = RouteProp<RootStackParamList, 'PhotoUpload'>;

const PhotoUploadScreen = () => {
  const navigation = useNavigation<PhotoUploadScreenNavigationProp>();
  const route = useRoute<PhotoUploadScreenRouteProp>();
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [mission, setMission] = useState<{ _id: string; title: string } | null>(null);
  const [loadingMission, setLoadingMission] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  
  const { photoUri } = route.params;

  useEffect(() => {
    const loadMission = async () => {
      try {
        setLoadingMission(true);
        const m = await missionAPI.getTodayMission();
        if (m && m._id) {
          setMission({ _id: m._id, title: m.title });
        } else {
          setMission(null);
        }
      } catch (e) {
        console.warn('오늘의 미션 조회 실패:', e);
        setMission(null);
      } finally {
        setLoadingMission(false);
      }
    };
    loadMission();
  }, []);

  const previewHeight = useMemo(() => 300, []);

  const getFileInfo = () => {
    // 간단한 파일 확장자 기반 mime 추정
    const name = 'upload.jpg';
    let type = 'image/jpeg';
    if (photoUri?.toLowerCase().endsWith('.png')) type = 'image/png';
    if (photoUri?.toLowerCase().endsWith('.heic')) type = 'image/heic';
    return { name, type };
  };

  const handleUpload = async () => {
    if (!photoUri) {
      Alert.alert('오류', '사진이 선택되지 않았습니다.');
      return;
    }
    if (!mission?._id) {
      Alert.alert('오류', '오늘의 미션을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsUploading(true);
    
    try {
      const form = new FormData();
      const { name, type } = getFileInfo();
      // @ts-ignore: React Native FormData file
      form.append('file', { uri: photoUri, name, type });
      form.append('comment', comment);
      form.append('missionId', mission._id);
  form.append('isPublic', String(isPublic));

      const result = await photoAPI.uploadPhoto(form) as any;
  if (result?.replaced) {
        Alert.alert('업로드 완료', '오늘 올린 사진이 있어 새 사진으로 교체됐어요.');
      } else {
        Alert.alert('업로드 완료', '오늘의 사진이 등록됐어요.');
      }
  navigation.navigate('UploadResult', { replaced: !!result?.replaced });
    } catch (error) {
      console.error('업로드 실패:', error);
      Alert.alert('오류', '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = () => {
    Alert.alert('공유', 'SNS 공유 기능을 구현합니다.');
  };

  return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="사진 업로드" />
      <View style={styles.content}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={[styles.previewImage, { height: previewHeight }]} />
        ) : (
          <View style={[styles.previewImage, { height: previewHeight, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: colors.subText }}>사진이 없습니다</Text>
          </View>
        )}

        <View style={styles.missionInfo}>        
          <Text style={styles.missionLabel}>미션</Text>
          {loadingMission ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.missionText}>불러오는 중…</Text>
            </View>
          ) : (
            <Text style={styles.missionText}>{mission?.title || '미션 없음'}</Text>
          )}
        </View>

        {/* 공개 설정 */}
        <View style={styles.publicRow}>
          <Text style={styles.publicLabel}>피드에 공개</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} />
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="오늘의 감정을 입력하세요 (선택사항)"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={200}
        />

        <View style={styles.buttonContainer}>
          <Button title={isUploading ? '업로드 중…' : '📤 업로드'} onPress={handleUpload} size="lg" fullWidth disabled={isUploading || loadingMission} />
          <Button title="📱 SNS 공유" onPress={handleShare} variant="secondary" size="lg" fullWidth />
        </View>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  previewImage: {
    width: '100%',
    borderRadius: 12,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  missionInfo: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  missionLabel: {
    fontSize: typography.small,
    color: colors.subText,
    marginBottom: spacing.xs,
  },
  missionText: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.text,
  },
  publicRow: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  publicLabel: { fontSize: typography.body, color: colors.text },
  commentInput: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: { gap: spacing.md },
});

export default PhotoUploadScreen;
