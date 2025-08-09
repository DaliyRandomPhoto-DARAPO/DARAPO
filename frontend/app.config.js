import 'dotenv/config';

// 중앙 상수/환경값 정리
const SCHEME = 'darapo';
const APP_NAME = 'DARAPO';
const PKG_ANDROID = 'com.darapo.drapoapp';
const BUNDLE_IOS = 'com.darapo.drapoapp';
const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default {
  expo: {
    name: APP_NAME,
    slug: APP_NAME,
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    // 딥링크 스킴(카카오 OAuth 완료 콜백: darapo://auth/callback)
    scheme: SCHEME,

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    ios: {
      bundleIdentifier: BUNDLE_IOS,
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: 'This app uses the camera to take photos for daily missions.',
        NSPhotoLibraryUsageDescription: 'This app needs access to photo library to save and share photos.',
        NSPhotoLibraryAddUsageDescription: 'This app saves captured photos to your photo library.',
        CFBundleURLTypes: [
          {
            CFBundleURLName: 'oauth',
            CFBundleURLSchemes: [SCHEME],
          },
        ],
      },
    },

    android: {
      package: PKG_ANDROID,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      // 명시 권한 축소: 카메라는 플러그인이 런타임 요청. 외부 저장소 권한은 최신 SDK에서 불필요.
      intentFilters: [
        {
          action: 'VIEW',
          category: ['DEFAULT', 'BROWSABLE'],
          data: { scheme: SCHEME },
        },
      ],
    },

    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera for taking photos.',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to access your photos for sharing.',
          savePhotosPermission: 'Allow $(PRODUCT_NAME) to save photos to your gallery.',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 34,
            buildToolsVersion: '35.0.0',
          },
          ios: {
            deploymentTarget: '15.1',
          },
        },
      ],
    ],

    extra: {
      // 프론트에서는 API 베이스 URL만 필요(실제 요청은 /api 접미사 자동 부착)
      apiUrl: RAW_API_URL,
    },
  },
};
