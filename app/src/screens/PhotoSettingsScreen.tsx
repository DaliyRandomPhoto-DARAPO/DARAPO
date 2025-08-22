import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Switch, Alert, Image, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { theme } from '../ui/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { photoAPI, BASE_URL } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoSettings'>;

// ===== Theme/Consts (불변)
const colors = Object.freeze({ ...theme.colors, primary: '#7C3AED', primaryAlt: '#EC4899' } as const);
const { spacing, typography } = theme;
const CONTENT_MAX_WIDTH = 640 as const;
const HIT_SLOP_8 = 8 as const;

// ===== utils
const joinUrl = (base: string, path?: string) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
};

// ===== Subcomponents
const Preview = memo(function Preview({ uri }: { uri?: string }) {
  if (!uri) return null;
  return (
    <View style={styles.imageWrap}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
    </View>
  );
});

const MissionInfo = memo(function MissionInfo({ title }: { title?: string }) {
  if (!title) return null;
  return (
    <View style={styles.missionBox}>
      <View style={styles.missionRow}>
        <View style={styles.missionDot} />
        <Text style={styles.missionLabel}>오늘의 미션</Text>
      </View>
      <Text style={styles.missionText}>{title}</Text>
    </View>
  );
});

const MoodInfo = memo(function MoodInfo({ comment }: { comment?: string }) {
  if (!comment) return null;
  return (
    <View style={styles.moodBox}>
      <View style={styles.moodRow}>
        <View style={styles.moodDot} />
        <Text style={styles.moodLabel}>감정</Text>
      </View>
      <Text style={styles.moodText}>{comment}</Text>
    </View>
  );
});

const Controls = memo(function Controls({
  isPublic,
  busy,
  onToggle,
  onDelete,
}: {
  isPublic: boolean;
  busy: boolean;
  onToggle: (next: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.controls}>
      <View style={styles.row}>
        <Text style={styles.label}>피드에 공개</Text>
        <Switch
          value={isPublic}
          onValueChange={onToggle}
          disabled={busy}
          accessibilityLabel="피드 공개 여부 토글"
        />
      </View>
      <Button
        title={busy ? '처리 중…' : '삭제'}
        onPress={onDelete}
        variant="danger"
        size="md"
        fullWidth
        disabled={busy}
      />
    </View>
  );
});

const PhotoSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { photoId, isPublic: initialPublic, imageUrl, missionTitle, comment } = route.params;
  const [isPublic, setIsPublic] = useState<boolean>(!!initialPublic);
  const [busy, setBusy] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  // unmount 가드: 비동기 중 setState 방지
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // URL 메모
  const resolvedUri = useMemo(() => joinUrl(BASE_URL, imageUrl), [imageUrl]);

  // 낙관적 토글 + 롤백 + 중복클릭 가드
  const toggleInFlight = useRef(false);
  const handleTogglePublic = useCallback(async (nextValue: boolean) => {
    if (toggleInFlight.current || busy) return;
    toggleInFlight.current = true;
    try {
      setBusy(true);
      setIsPublic(nextValue); // optimistic
      const updated = await photoAPI.updatePhoto(photoId, { isPublic: nextValue });
      if (mountedRef.current) setIsPublic(!!updated?.isPublic);
    } catch (e) {
      if (mountedRef.current) {
        setIsPublic(prev => !prev); // rollback
        Alert.alert('오류', '공개 설정 변경 실패');
      }
    } finally {
      if (mountedRef.current) setBusy(false);
      toggleInFlight.current = false;
    }
  }, [photoId, busy]);

  const handleDelete = useCallback(() => {
    if (busy) return;
    Alert.alert('삭제', '이 사진을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (busy) return;
          try {
            setBusy(true);
            await photoAPI.deletePhoto(photoId);
            if (!mountedRef.current) return;
            navigation.goBack();
          } catch (e) {
            if (mountedRef.current) Alert.alert('오류', '삭제에 실패했습니다.');
          } finally {
            if (mountedRef.current) setBusy(false);
          }
        },
      },
    ]);
  }, [busy, navigation, photoId]);

  const contentPadBottom = useMemo(() => insets.bottom + spacing.xl, [insets.bottom]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="사진 설정" />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPadBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centered}>
            <Card style={styles.card}>
              <Preview uri={resolvedUri} />
              <MissionInfo title={missionTitle} />
              <MoodInfo comment={comment} />
              <Controls
                isPublic={isPublic}
                busy={busy}
                onToggle={handleTogglePublic}
                onDelete={handleDelete}
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },

  scrollContent: {
    paddingHorizontal: spacing.md,   // lg → md
    paddingTop: spacing.md,          // lg → md
  },
  centered: { alignSelf: 'center', width: '100%', maxWidth: CONTENT_MAX_WIDTH },

  card: { padding: spacing.md - 4 }, // md보다 살짝 더 타이트

  // 이미지
  imageWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: spacing.md }, // 16→12, lg→md
  image: { width: '100%', aspectRatio: 1 },

  // 미션 박스 (컴팩트)
  missionBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,            // 16 → 12
    padding: spacing.sm,         // md → sm
    marginBottom: spacing.sm,    // md → sm
  },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 }, // 4 → 2
  missionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 4 }, // 8 → 6
  missionLabel: { fontSize: 11, color: colors.primary, fontWeight: '600', lineHeight: 14 }, // 12→11
  missionText: { fontSize: 14, color: colors.text, fontWeight: '700', lineHeight: 18 },     // 16→14

  // 감정 박스 (컴팩트)
  moodBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,            // 16 → 12
    padding: spacing.sm,         // md → sm
    marginBottom: spacing.md,    // lg → md
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 }, // 4 → 2
  moodDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryAlt, marginRight: 4 }, // 8 → 6
  moodLabel: { fontSize: 11, color: colors.primaryAlt, fontWeight: '600', lineHeight: 14 }, // 12→11
  moodText: { fontSize: 13, color: '#374151', lineHeight: 17 },                              // 14→13

  // 컨트롤 영역 전반 축소
  controls: { gap: spacing.sm }, // md → sm
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, // lg → md
    paddingVertical: spacing.sm,   // md → sm
    borderRadius: 12,              // 16 → 12
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    // 기존 typography.body 그대로면 큰 편이면 살짝 다운
    fontSize: Math.max(14, (Number(typography.body) || 16) - 2), // 16→14 근처
    color: colors.text,
    fontWeight: '600',
  },
});

export default PhotoSettingsScreen;
