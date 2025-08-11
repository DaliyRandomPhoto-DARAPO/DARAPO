import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { photoAPI, missionAPI } from '../services/api';
import Header from '../ui/Header';
import { colors, spacing, typography } from '../ui/theme';

type PhotoUploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoUpload'>;
type PhotoUploadScreenRouteProp = RouteProp<RootStackParamList, 'PhotoUpload'>;

const PhotoUploadScreen = () => {
  const navigation = useNavigation<PhotoUploadScreenNavigationProp>();
  const route = useRoute<PhotoUploadScreenRouteProp>();
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [mission, setMission] = useState<{ _id: string; title: string } | null>(null);
  const [loadingMission, setLoadingMission] = useState(true);
  
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

      await photoAPI.uploadPhoto(form);
      navigation.navigate('UploadResult');
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
    <SafeAreaView style={styles.container}>
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

        <TextInput
          style={styles.commentInput}
          placeholder="코멘트를 입력하세요 (선택사항)"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={200}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.uploadButton, isUploading && { opacity: 0.7 }]}
            onPress={handleUpload}
            disabled={isUploading || loadingMission}
          >
            <Text style={styles.buttonText}>{isUploading ? '업로드 중…' : '📤 업로드'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            onPress={handleShare}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>📱 SNS 공유</Text>
          </TouchableOpacity>
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
  paddingHorizontal: spacing.lg,
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
  commentInput: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: colors.primary,
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: typography.body,
    fontWeight: 'bold',
  },
});

export default PhotoUploadScreen;
