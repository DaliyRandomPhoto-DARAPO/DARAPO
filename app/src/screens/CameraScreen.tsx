import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { missionAPI } from '../services/api';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

const COLORS = Object.freeze({
  overlay: 'rgba(0,0,0,0.5)',
  white: '#fff',
  primary: '#007AFF',
} as const);

const TAKE_OPTIONS = Object.freeze({ quality: 0.85, skipProcessing: true } as const);
const CAMERA_STATIC_PROPS = Object.freeze({ enableShutterSound: false } as any);

const TopBar = memo(({ loading, mission }: { loading: boolean; mission?: any | null }) => (
  <View style={styles.topBar}>
    <View style={styles.missionContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.missionText} numberOfLines={1}>
              {mission?.title ?? '오늘의 미션'}
            </Text>
            {mission?.isRare ? <Text style={{ color: '#FBBF24', marginLeft: 8 }}>✨</Text> : null}
          </View>
          {!!mission?.subtitle && <Text style={{ color: '#FFFFFFAA', fontSize: 12 }}>{mission.subtitle}</Text>}
        </View>
      )}
    </View>
  </View>
));

const CaptureButton = memo(({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.captureButton, disabled && styles.captureDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <View style={[styles.captureButtonInner, disabled && styles.captureInnerDisabled]} />
  </TouchableOpacity>
));

const BottomBar = memo(({ captureDisabled, onCapture }: { captureDisabled: boolean; onCapture: () => void }) => (
  <View style={styles.bottomBar}>
    <View style={styles.spacer} />
    <CaptureButton disabled={captureDisabled} onPress={onCapture} />
    <View style={styles.spacer} />
  </View>
));

const CameraScreen = () => {
  // --------- 모든 훅은 여기(조건부 X) ----------
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [todayMission, setTodayMission] = useState<any | string>('오늘의 미션');
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<CameraScreenNavigationProp>();
  const cameraRef = useRef<CameraView>(null);
  const takingRef = useRef(false);

  const permissionGranted = !!permission?.granted;

  const loadTodayMission = useCallback(async () => {
    try {
      setLoading(true);
  const mission = await missionAPI.getTodayMission();
  setTodayMission(mission || '오늘의 미션');
    } catch (e) {
      console.error('미션 로드 실패:', e);
      setTodayMission('오늘의 미션');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayMission();
  }, [loadTodayMission]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((cur) => (cur === 'back' ? 'front' : 'back'));
  }, []);

  const takePicture = useCallback(async () => {
    if (takingRef.current) return;
    const cam = cameraRef.current as any;
    if (!cam?.takePictureAsync) return;
    try {
      takingRef.current = true;
      const photo = await cam.takePictureAsync(TAKE_OPTIONS);
      if (photo?.uri) {
        navigation.navigate('PhotoUpload', { photoUri: photo.uri });
      } else {
        Alert.alert('오류', '사진 데이터가 비정상이에요.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    } finally {
      takingRef.current = false;
    }
  }, [navigation]);

  const onGrant = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  const captureDisabled = useMemo(() => loading || takingRef.current, [loading]);

  // --------- 여기서 분기(return). 훅은 이미 전부 호출됨 ----------
  if (!permission) return <View />;

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity onPress={onGrant} style={styles.permissionButton} activeOpacity={0.8}>
          <Text style={styles.permissionButtonText}>권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} {...CAMERA_STATIC_PROPS} />

      <View style={styles.overlay} pointerEvents="box-none">
  <TopBar loading={loading} mission={typeof todayMission === 'string' ? undefined : (todayMission as any)} />

        {/* 필요하면 토글 버튼 노출 */}
        {/* <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing} /> */}

        <BottomBar captureDisabled={captureDisabled} onCapture={takePicture} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.overlay, padding: 15,
  },
  missionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  missionText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
    backgroundColor: COLORS.overlay, justifyContent: 'space-between',
  },
  spacer: { width: 50 },

  captureButton: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
  },
  captureButtonInner: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary,
  },
  captureDisabled: { opacity: 0.5 },
  captureInnerDisabled: { backgroundColor: '#9CC3FF' },

  flipButton: {
    position: 'absolute', right: 20, top: 12,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center',
  },

  permissionButton: {
    backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, margin: 20,
  },
  permissionButtonText: { color: COLORS.white, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
});

export default memo(CameraScreen);
