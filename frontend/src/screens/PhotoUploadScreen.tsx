import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, Alert, ActivityIndicator, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { photoAPI, missionAPI } from '../services/api';
import Header from '../ui/Header';
import Card from '../ui/Card';
import { theme } from '../ui/theme';

// Use shared theme with brand overrides to match Home/Feed
const colors = { ...theme.colors, primary: '#7C3AED', primaryAlt: '#EC4899' } as const;
const { spacing, typography, radii } = theme;
import Button from '../ui/Button';

type PhotoUploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoUpload'>;
type PhotoUploadScreenRouteProp = RouteProp<RootStackParamList, 'PhotoUpload'>;

const PhotoUploadScreen = () => {
  const navigation = useNavigation<PhotoUploadScreenNavigationProp>();
  const route = useRoute<PhotoUploadScreenRouteProp>();
  const insets = useSafeAreaInsets();
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
      // 결과 화면을 거치지 않고 홈으로 이동
      // @ts-ignore: resetRoot는 NavigationContainer에서 사용되지만 여기선 간단히 루트 리셋 대체
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            params: { screen: 'Home' },
          } as any,
        ],
      });
    } catch (error) {
      console.error('업로드 실패:', error);
      Alert.alert('오류', '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // TODO: SNS 공유 기능 추후 활성화 예정
  // const handleShare = async () => { /* ... */ };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="사진 업로드" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 12 : 0}
      >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.lg + insets.bottom + 120 },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        {/* 미리보기 카드 */}
        <Card style={styles.previewCard}>
          {photoUri ? (
            <View style={{ borderRadius: radii.lg, overflow: 'hidden' }}>
              <Image source={{ uri: photoUri }} style={[styles.previewImage, { height: previewHeight }]} resizeMode="cover" />
            </View>
          ) : (
            <View style={[styles.previewImage, { height: previewHeight, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: colors.subText }}>사진이 없습니다</Text>
            </View>
          )}
        </Card>

        {/* 오늘의 미션 박스 (Feed 스타일) */}
        <Card style={styles.infoCard}>
          <View style={styles.missionRowTop}>
            <View style={styles.missionDot} />
            <Text style={styles.missionBadge}>오늘의 미션</Text>
          </View>
          {loadingMission ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.missionText}>불러오는 중…</Text>
            </View>
          ) : (
            <Text style={styles.missionText}>{mission?.title || '미션 없음'}</Text>
          )}
        </Card>

        {/* 감정 메모 */}
        <Card style={styles.infoCard}>
          <View style={styles.moodHeader}>
            <View style={[styles.moodDot]} />
            <Text style={styles.moodBadge}>감정</Text>
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="오늘의 감정을 입력하세요 (선택사항)"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={200}
          />
        </Card>

        {/* 공개 설정 */}
        <Card style={styles.infoCard}>
          <View style={styles.publicRow}> 
            <Text style={styles.publicLabel}>피드에 공개</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button title={isUploading ? '업로드 중…' : '업로드'} onPress={handleUpload} size="lg" fullWidth disabled={isUploading || loadingMission} />
          {/** SNS 공유 버튼은 배포에서 제외 (추후 활성화)
           * <Button title="📱 SNS 공유" onPress={handleShare} variant="secondary" size="lg" fullWidth />
           */}
        </View>
  </ScrollView>
  </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  previewCard: { marginBottom: spacing.lg },
  previewImage: { width: '100%', backgroundColor: colors.surface },
  infoCard: { marginBottom: spacing.lg },
  missionRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  missionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 },
  missionBadge: { fontSize: typography.small, color: colors.primary, fontWeight: '700' },
  missionText: {
    fontSize: typography.h2,
    fontWeight: '800',
    color: colors.text,
  },
  publicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  publicLabel: { fontSize: typography.body, color: colors.text },
  commentInput: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  moodHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryAlt, marginRight: 6 },
  moodBadge: { fontSize: typography.small, color: colors.primaryAlt, fontWeight: '700' },
  buttonContainer: { gap: spacing.md },
});

export default PhotoUploadScreen;
