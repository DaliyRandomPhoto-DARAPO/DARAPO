import React, { useState } from 'react';
import { View, StyleSheet, Text, Switch, Alert, Image, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { theme } from '../ui/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { photoAPI, BASE_URL } from '../services/api';

const colors = { ...theme.colors, primary: '#7C3AED' } as const;
const { spacing, typography } = theme;

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoSettings'>;

const CONTENT_MAX_WIDTH = 720;

const PhotoSettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { photoId, isPublic: initialPublic, imageUrl, missionTitle, comment } = route.params;
  const [isPublic, setIsPublic] = useState<boolean>(!!initialPublic);
  const [busy, setBusy] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  // Switch는 onValueChange로 새 값이 넘어온다. 그 값 기준으로 처리해.
  const handleTogglePublic = async (nextValue: boolean) => {
    try {
      setBusy(true);
      setIsPublic(nextValue); // 낙관적 업데이트
      const updated = await photoAPI.updatePhoto(photoId, { isPublic: nextValue });
      setIsPublic(!!updated.isPublic);
    } catch (e) {
      setIsPublic(prev => !prev); // 롤백
      Alert.alert('오류', '공개 설정 변경 실패');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('삭제', '이 사진을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusy(true);
            await photoAPI.deletePhoto(photoId);
            // 이전 화면 새로고침 필요하면 params로 신호 던져라
            navigation.goBack();
          } catch (e) {
            Alert.alert('오류', '삭제에 실패했습니다.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  // 이미지 URL 안전하게 합치기 (이중 슬래시 방지)
  const resolvedUri =
    imageUrl && imageUrl.startsWith('http')
      ? imageUrl
      : imageUrl
      ? `${BASE_URL.replace(/\/$/, '')}/${imageUrl.replace(/^\//, '')}`
      : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="사진 설정" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: insets.bottom + spacing.xl, // 하단 여유 + 안전영역
          }}
        >
          <View style={{ alignSelf: 'center', width: '100%', maxWidth: CONTENT_MAX_WIDTH }}>
            <Card style={styles.card}>
              {/* 미리보기 */}
              {resolvedUri ? (
                <View style={styles.imageWrap}>
                  <Image source={{ uri: resolvedUri }} style={styles.image} resizeMode="cover" />
                </View>
              ) : null}

              {/* 미션/감정 정보 */}
              {!!missionTitle && (
                <View style={styles.missionBox}>
                  <View style={styles.missionRow}>
                    <View style={styles.missionDot} />
                    <Text style={styles.missionLabel}>오늘의 미션</Text>
                  </View>
                  <Text style={styles.missionText}>{missionTitle}</Text>
                </View>
              )}

              {!!comment && (
                <View style={styles.moodBox}>
                  <View style={styles.moodRow}>
                    <View style={styles.moodDot} />
                    <Text style={styles.moodLabel}>감정</Text>
                  </View>
                  <Text style={styles.moodText}>{comment}</Text>
                </View>
              )}

              {/* 하단 설정 컨트롤 */}
              <View style={styles.controls}>
                <View style={styles.row}>
                  <Text style={styles.label}>피드에 공개</Text>
                  <Switch
                    value={isPublic}
                    onValueChange={handleTogglePublic}
                    disabled={busy}
                    accessibilityLabel="피드 공개 여부 토글"
                  />
                </View>
                <Button
                  title={busy ? '처리 중…' : '삭제'}
                  onPress={handleDelete}
                  variant="danger"
                  size="lg"
                  fullWidth
                  disabled={busy}
                />
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { padding: spacing.md },

  imageWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: spacing.lg },
  image: { width: '100%', aspectRatio: 1 }, // 폭 기준 정사각. 반응형 OK

  missionBox: { backgroundColor: '#F5F3FF', borderRadius: 16, padding: spacing.md, marginBottom: spacing.md },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  missionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 },
  missionLabel: { fontSize: 12, color: colors.primary, fontWeight: '600', lineHeight: 16 },
  missionText: { fontSize: 16, color: colors.text, fontWeight: '700', lineHeight: 20 },

  moodBox: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  moodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EC4899', marginRight: 6 },
  moodLabel: { fontSize: 12, color: '#EC4899', fontWeight: '600', lineHeight: 16 },
  moodText: { fontSize: 14, color: '#374151', lineHeight: 18 },

  // gap은 RN 0.71+ 아니면 안 먹음. 구버전이면 아래 margin 방식으로 대체
  controls: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { fontSize: Number(typography.body) || 16, color: colors.text, fontWeight: '600' },
});

export default PhotoSettingsScreen;
