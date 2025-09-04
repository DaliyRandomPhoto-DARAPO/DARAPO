import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { photoAPI, missionAPI } from "../services/api";
import { normalizeMission } from "../utils/mission";
import * as ImageManipulator from "expo-image-manipulator";
import Card from "../ui/Card";
import Header from "../ui/Header";
import { theme } from "../ui/theme";
import Button from "../ui/Button";
// ⛔️ MissionInfo 제거 (이 화면에서만 스타일 커스텀)
import type { Mission } from "../types/mission";

type PhotoUploadScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PhotoUpload"
>;
type PhotoUploadScreenRouteProp = RouteProp<RootStackParamList, "PhotoUpload">;

// ===== Theme / Consts
const colors = Object.freeze({
  ...theme.colors,
  primary: "#7C3AED",
  primaryAlt: "#EC4899",
} as const);
const { spacing, radii } = theme;
const PREVIEW_HEIGHT = 300 as const;
const MAX_WIDTH = 1440 as const;
const JPEG_QUALITY = 0.8 as const;

// ⬇️ 이 화면 전용 미션 타이포/간격 (여기서만 영향)
const MISSION_TYPO = Object.freeze({
  titleSize: 16,
  descSize: 13,
  lineHeightT: 22,
  lineHeightD: 19,
});

const pickMissionText = (m?: Mission | null) => {
  if (!m) return { title: "", desc: "" };

  const getStr = (v: unknown) => (typeof v === "string" ? v : "");

  // title 우선순위: title -> name
  const title =
    ("title" in (m as object) && getStr((m as any).title)) ||
    ("name" in (m as object) && getStr((m as any).name)) ||
    "";

  // desc 우선순위: description -> desc
  const desc =
    ("description" in (m as object) && getStr((m as any).description)) ||
    ("desc" in (m as object) && getStr((m as any).desc)) ||
    "";

  return { title, desc };
};

// ===== Pure helpers
function pickMime(uri: string): { name: string; type: string } {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return { name: "upload.png", type: "image/png" };
  if (lower.endsWith(".heic") || lower.endsWith(".heif"))
    return { name: "upload.heic", type: "image/heic" };
  return { name: "upload.jpg", type: "image/jpeg" };
}

const PreviewCard = memo(function PreviewCard({ uri }: { uri?: string }) {
  return (
    <Card style={styles.previewCard}>
      {uri ? (
        <View style={styles.previewImageWrap}>
          <Image
            source={{ uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.previewEmpty}>
          <Text style={styles.previewEmptyText}>사진이 없습니다</Text>
        </View>
      )}
    </Card>
  );
});

// ✅ 공통 섹션 헤더 (점 + 배지) — 미션/감정 모두 사용
const SectionHeader = memo(function SectionHeader({
  dotColor,
  label,
}: {
  dotColor: string;
  label: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.sectionBadge, { color: dotColor }]}>{label}</Text>
    </View>
  );
});

// ✅ 공통 섹션 카드 — 위/아래 간격, 배경, 라운드 통일
const SectionCard = memo(function SectionCard({
  dotColor,
  label,
  children,
}: {
  dotColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.infoCard}>
      <SectionHeader dotColor={dotColor} label={label} />
      <View style={styles.sectionBody}>{children}</View>
    </Card>
  );
});

// ✅ 감정 섹션 (이전 CommentCard 대체)
const MoodSection = memo(function MoodSection({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <SectionCard dotColor={colors.primaryAlt} label="감정">
      <TextInput
        style={styles.commentInput}
        placeholder="오늘의 감정을 입력해주세요.(선택사항)"
        placeholderTextColor={colors.subText}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={200}
      />
    </SectionCard>
  );
});

// ✅ 공개 여부 섹션 — 카드 톤 통일
const PublicSection = memo(function PublicSection({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <SectionCard dotColor={colors.primary} label="피드 공개">
      <View style={styles.publicRow}>
        <Text style={styles.publicLabel}>피드에 공개</Text>
        <Switch value={value} onValueChange={onToggle} />
      </View>
    </SectionCard>
  );
});

// ✅ 미션 섹션 — 이 화면만의 타이포 적용
const MissionSection = memo(function MissionSection({
  loading,
  mission,
}: {
  loading: boolean;
  mission: Mission | null;
}) {
  if (loading) {
    return (
      <SectionCard dotColor={colors.primary} label="오늘의 미션">
        <View style={styles.missionLoadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.missionTextLoading}>불러오는 중…</Text>
        </View>
      </SectionCard>
    );
  }

  if (!mission) {
    return (
      <SectionCard dotColor={colors.primary} label="오늘의 미션">
        <Text style={styles.missionTitle}>오늘의 미션이 없어요!</Text>
        <Text style={styles.missionDescSub}>잠시 후 다시 시도해봐 ㅋㅋ</Text>
      </SectionCard>
    );
  }

  // mission 필드 네이밍은 프로젝트 타입에 맞춰 조정
  const { title, desc } = pickMissionText(mission);

  return (
    <SectionCard dotColor={colors.primary} label="오늘의 미션">
      <Text style={styles.missionTitle} numberOfLines={2}>
        {title}
      </Text>
      {!!desc && (
        <Text style={styles.missionDesc} numberOfLines={3}>
          {desc}
        </Text>
      )}
    </SectionCard>
  );
});

const PhotoUploadScreen = () => {
  const navigation = useNavigation<PhotoUploadScreenNavigationProp>();
  const route = useRoute<PhotoUploadScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { photoUri } = route.params;

  const [comment, setComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [loadingMission, setLoadingMission] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const abortRef = useRef<AbortController | null>(null);
  const uploadingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const loadMission = useCallback(async () => {
    try {
      setLoadingMission(true);
      const m = await missionAPI.getTodayMission();
      if (!mountedRef.current) return;
      const norm = normalizeMission(m);
      setMission(norm && (norm as any)._id ? norm : null);
    } catch (e) {
      console.warn("오늘의 미션 조회 실패:", e);
      if (mountedRef.current) setMission(null);
    } finally {
      if (mountedRef.current) setLoadingMission(false);
    }
  }, []);

  useEffect(() => {
    loadMission();
  }, [loadMission]);

  const fileInfo = useMemo(() => pickMime(photoUri ?? ""), [photoUri]);

  const preprocessImage = useCallback(async (uri: string) => {
    const actions: ImageManipulator.Action[] = [
      { resize: { width: MAX_WIDTH } },
    ];
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  }, []);

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

  // 하단 여백: 플랫폼별 고정치 + 안전영역. (이중보정 방지)
  const contentBottomPad = useMemo(
    () => spacing.lg + insets.bottom + (Platform.OS === "ios" ? 48 : 120),
    [insets.bottom],
  );

  const progressText = useMemo(
    () =>
      typeof progress === "number" ? `업로드 ${progress}%` : "업로드 준비 중…",
    [progress],
  );

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!photoUri) {
      Alert.alert("오류", "사진이 선택되지 않았습니다.");
      return;
    }
    const missionId = mission?._id;
    if (!missionId) {
      Alert.alert(
        "오류",
        "오늘의 미션을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }
    if (uploadingRef.current) return;

    uploadingRef.current = true;
    setIsUploading(true);
    setProgress(undefined);
    abortRef.current = new AbortController();

    try {
      const processedUri = await preprocessImage(photoUri);

      const form = new FormData();
      // @ts-ignore RN FormData file
      form.append("file", {
        uri: processedUri,
        name: fileInfo.name,
        type: fileInfo.type,
      });
      form.append("comment", comment);
      form.append("missionId", missionId);
      form.append("isPublic", String(isPublic));

      const result: any = await photoAPI.uploadPhoto(form, {
        onProgress: (p: any) => {
          const v = Math.max(
            0,
            Math.min(100, Math.round(Number(p?.percent ?? 0))),
          );
          if (mountedRef.current) setProgress(v);
        },
        signal: abortRef.current?.signal,
      });

      if (!mountedRef.current) return;

      Alert.alert(
        "업로드 완료",
        result?.replaced
          ? "오늘 올린 사진이 있어 새 사진으로 교체됐어요."
          : "오늘의 사진이 등록됐어요.",
      );

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { screen: "Home" } }] as any,
      });
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("업로드 실패:", error);
        if (mountedRef.current)
          Alert.alert(
            "오류",
            "업로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
          );
      }
    } finally {
      if (mountedRef.current) {
        setIsUploading(false);
        setProgress(undefined);
      }
      abortRef.current = null;
      uploadingRef.current = false;
    }
  }, [
    photoUri,
    mission?._id,
    preprocessImage,
    fileInfo.name,
    fileInfo.type,
    comment,
    isPublic,
    navigation,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Header title="사진 업로드" />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: contentBottomPad },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={false}
        >
          <PreviewCard uri={photoUri} />

          {/* ✅ 통일된 미션 섹션 */}
          <MissionSection loading={loadingMission} mission={mission} />

          {/* ✅ 통일된 감정 섹션 */}
          <MoodSection value={comment} onChangeText={setComment} />

          {/* ✅ 통일된 공개 섹션 */}
          <PublicCard value={isPublic} onToggle={setIsPublic} />

          <View style={styles.buttonContainer}>
            <Button
              title={isUploading ? "업로드 중…" : "업로드"}
              onPress={handleUpload}
              size="lg"
              fullWidth
              disabled={isUploading || loadingMission}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <UploadOverlay
        visible={isUploading}
        progressText={progressText}
        onCancel={cancelUpload}
      />
    </SafeAreaView>
  );
};

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

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  // Preview
  previewCard: { marginBottom: spacing.md, padding: 0, overflow: "hidden" },
  previewImageWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  previewImage: {
    width: "100%",
    height: PREVIEW_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  previewEmpty: {
    width: "100%",
    height: PREVIEW_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  previewEmptyText: { color: colors.subText, fontSize: 14 },

  // 공통 섹션
  infoCard: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sectionDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  sectionBadge: { fontSize: 12, fontWeight: "700" },
  sectionBody: { paddingTop: spacing.sm },

  // 미션 타이포 (이 화면만)
  missionLoadingRow: { flexDirection: "row", alignItems: "center" },
  missionTextLoading: {
    marginLeft: spacing.md,
    color: colors.text,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  missionTitle: {
    color: colors.text,
    fontSize: MISSION_TYPO.titleSize,
    lineHeight: MISSION_TYPO.lineHeightT,
    fontWeight: "700",
  },
  missionDesc: {
    marginTop: 6,
    color: colors.subText,
    fontSize: MISSION_TYPO.descSize,
    lineHeight: MISSION_TYPO.lineHeightD,
  },
  missionDescSub: {
    marginTop: 6,
    color: colors.subText,
    fontSize: MISSION_TYPO.descSize,
    lineHeight: MISSION_TYPO.lineHeightD,
  },

  // 감정 입력
  commentInput: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
    textAlignVertical: "top",
    color: colors.text,
    borderRadius: radii.md,
    fontSize: 14,
  },

  // 공개
  publicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  publicLabel: { fontSize: 16, color: colors.text },

  buttonContainer: { marginTop: spacing.sm },

  // Overlay
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    minWidth: 240,
    alignItems: "center",
  },
  overlayText: { marginTop: 8, color: colors.text, fontWeight: "600" },
  overlaySpacer: { height: 12 },
});

export default memo(PhotoUploadScreen);
