import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { photoAPI, missionAPI } from '../services/api';
import * as ImageManipulator from 'expo-image-manipulator';
import Header from '../ui/Header';
import Card from '../ui/Card';
import { theme } from '../ui/theme';
import Button from '../ui/Button';

type PhotoUploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoUpload'>;
type PhotoUploadScreenRouteProp = RouteProp<RootStackParamList, 'PhotoUpload'>;

// ===== Theme / Consts (불변)
const colors = Object.freeze({ ...theme.colors, primary: '#7C3AED', primaryAlt: '#EC4899' } as const);
const { spacing, typography, radii } = theme;
const PREVIEW_HEIGHT = 300 as const;
const MAX_WIDTH = 1440 as const;
const JPEG_QUALITY = 0.8 as const;

// ===== Pure helpers
function pickMime(uri: string): { name: string; type: string } {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return { name: 'upload.png', type: 'image/png' };
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return { name: 'upload.heic', type: 'image/heic' };
  return { name: 'upload.jpg', type: 'image/jpeg' };
}

// ===== Subcomponents (memo)
const MissionCard = memo(function MissionCard({
  loading,
  title,
}: {
  loading: boolean;
  title: string;
}) {
  return (
    <Card style={styles.infoCard}>
      <View style={styles.missionRowTop}>
        <View style={styles.missionDot} />
        <Text style={styles.missionBadge}>오늘의 미션</Text>
      </View>
      {loading ? (
        <View style={styles.missionLoadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.missionTextLoading}>불러오는 중…</Text>
        </View>
      ) : (
        <Text style={styles.missionText}>{title}</Text>
      )}
    </Card>
  );
});

const PreviewCard = memo(function PreviewCard({
  uri,
}: {
  uri?: string;
}) {
  return (
    <Card style={styles.previewCard}>
      {uri ? (
        <View style={styles.previewImageWrap}>
          <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.previewEmpty}>
          <Text style={styles.previewEmptyText}>사진이 없습니다</Text>
        </View>
      )}
    </Card>
  );
});

const CommentCard = memo(function CommentCard({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <Card style={styles.infoCard}>
      <View style={styles.moodHeader}>
        <View style={styles.moodDot} />
        <Text style={styles.moodBadge}>감정</Text>
      </View>
      <TextInput
        style={styles.commentInput}
        placeholder="오늘의 감정을 입력해주세요.(선택사항)"
        placeholderTextColor={colors.subText}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={200}
      />
    </Card>
  );
});

const PublicCard = memo(function PublicCard({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  const onChange = useCallback(() => onToggle(!value), [onToggle, value]);
  return (
    <Card style={styles.infoCard}>
      <View style={styles.publicRow}>
        <Text style={styles.publicLabel}>피드에 공개</Text>
        <Switch value={value} onValueChange={onChange} />
      </View>
    </Card>
  );
});

const UploadOverlay = memo(function UploadOverlay({
  visible,
  progressText,
  onCancel,
}: {
  visible: boolean;
  progressText: string;
  onCancel: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={styles.overlay} accessibilityLabel="업로드 진행 중">
      <View style={styles.overlayBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.overlayText}>{progressText}</Text>
        <View style={styles.overlaySpacer} />
        <Button title="취소" onPress={onCancel} variant="secondary" />
      </View>
    </View>
  );
});

const PhotoUploadScreen = () => {
  const navigation = useNavigation<PhotoUploadScreenNavigationProp>();
  const route = useRoute<PhotoUploadScreenRouteProp>();
  const insets = useSafeAreaInsets();

  const { photoUri } = route.params;

  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [mission, setMission] = useState<{ _id: string; title: string } | null>(null);
  const [loadingMission, setLoadingMission] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const abortRef = useRef<AbortController | null>(null);
  const uploadingRef = useRef(false); // 중복 업로드 가드
  const mountedRef = useRef(true);

  // 언마운트 시 진행중이면 abort
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // 미션 불러오기
  const loadMission = useCallback(async () => {
    try {
      setLoadingMission(true);
      const m = await missionAPI.getTodayMission();
      if (!mountedRef.current) return;
      if (m && m._id) setMission({ _id: m._id, title: m.title });
      else setMission(null);
    } catch (e) {
      console.warn('오늘의 미션 조회 실패:', e);
      if (mountedRef.current) setMission(null);
    } finally {
      if (mountedRef.current) setLoadingMission(false);
    }
  }, []);

  useEffect(() => {
    loadMission();
  }, [loadMission]);

  const fileInfo = useMemo(() => pickMime(photoUri ?? ''), [photoUri]);

  const preprocessImage = useCallback(async (uri: string) => {
    // 원본이 더 작으면 expo가 알아서 최소 변경만 함
    const actions: ImageManipulator.Action[] = [{ resize: { width: MAX_WIDTH } }];
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  }, []);

  const contentBottomPad = useMemo(
    () => spacing.lg + insets.bottom + 120,
    [insets.bottom]
  );

  const progressText = useMemo(() => {
    if (typeof progress === 'number') return `업로드 ${progress}%`;
    return '업로드 준비 중…';
  }, [progress]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!photoUri) {
      Alert.alert('오류', '사진이 선택되지 않았습니다.');
      return;
    }
    if (!mission?._id) {
      Alert.alert('오류', '오늘의 미션을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (uploadingRef.current) return; // 중복 클릭 차단

    uploadingRef.current = true;
    setIsUploading(true);
    setProgress(undefined);
    abortRef.current = new AbortController();

    try {
      const processedUri = await preprocessImage(photoUri);

      const form = new FormData();
      // @ts-ignore RN FormData file
      form.append('file', { uri: processedUri, name: fileInfo.name, type: fileInfo.type });
      form.append('comment', comment);
      form.append('missionId', mission._id);
      form.append('isPublic', String(isPublic));

      const result = (await photoAPI.uploadPhoto(form, {
        onProgress: (p: any) => {
          // 업로드 진행률 0~100
          const v = Math.max(0, Math.min(100, Math.round(Number(p?.percent ?? 0))));
          if (mountedRef.current) setProgress(v);
        },
        signal: abortRef.current?.signal,
      })) as any;

      if (!mountedRef.current) return;

      if (result?.replaced) {
        Alert.alert('업로드 완료', '오늘 올린 사진이 있어 새 사진으로 교체됐어요.');
      } else {
        Alert.alert('업로드 완료', '오늘의 사진이 등록됐어요.');
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } } as any],
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // 취소면 조용히
      } else {
        console.error('업로드 실패:', error);
        if (mountedRef.current) Alert.alert('오류', '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      if (mountedRef.current) {
        setIsUploading(false);
        setProgress(undefined);
      }
      abortRef.current = null;
      uploadingRef.current = false;
    }
  }, [photoUri, mission?._id, preprocessImage, fileInfo.name, fileInfo.type, comment, isPublic, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="사진 업로드" />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 12 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: contentBottomPad }]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <PreviewCard uri={photoUri} />

          <MissionCard loading={loadingMission} title={mission?.title || '미션 없음'} />

          <CommentCard value={comment} onChangeText={setComment} />

          <PublicCard value={isPublic} onToggle={setIsPublic} />

          <View style={styles.buttonContainer}>
            <Button
              title={isUploading ? '업로드 중…' : '업로드'}
              onPress={handleUpload}
              size="lg"
              fullWidth
              disabled={isUploading || loadingMission}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <UploadOverlay visible={isUploading} progressText={progressText} onCancel={cancelUpload} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  // Preview
  previewCard: { marginBottom: spacing.lg },
  previewImageWrap: { borderRadius: radii.lg, overflow: 'hidden' },
  previewImage: { width: '100%', height: PREVIEW_HEIGHT, backgroundColor: colors.surface },
  previewEmpty: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmptyText: { color: colors.subText },

  // Info
  infoCard: { marginBottom: spacing.lg },

  missionRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  missionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 },
  missionBadge: { fontSize: typography.small, color: colors.primary, fontWeight: '700' },
  missionLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  missionTextLoading: { marginLeft: spacing.sm, color: colors.text },
  missionText: { fontSize: typography.h2, fontWeight: '800', color: colors.text },

  moodHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryAlt, marginRight: 6 },
  moodBadge: { fontSize: typography.small, color: colors.primaryAlt, fontWeight: '700' },

  commentInput: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    fontSize: typography.body,
  },

  publicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  publicLabel: { fontSize: typography.body, color: colors.text },

  buttonContainer: { gap: spacing.md },

  // Overlay
  overlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  overlayText: { marginTop: 8, color: colors.text, fontWeight: '600' },
  overlaySpacer: { height: 12 },
});

export default memo(PhotoUploadScreen);
