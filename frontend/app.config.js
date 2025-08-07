import 'dotenv/config';

export default {
  expo: {
    name: "DARAPO",
    slug: "DARAPO",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "darapo", // OAuth 리다이렉트용 커스텀 스키마
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "com.darapo.drapoapp",
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to take photos for daily missions.",
        NSPhotoLibraryUsageDescription: "This app needs access to photo library to save and share photos.",
        CFBundleURLTypes: [
          {
            CFBundleURLName: "oauth",
            CFBundleURLSchemes: ["darapo"]
          }
        ]
      }
    },
    android: {
      package: "com.darapo.drapoapp",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ],
      intentFilters: [
        {
          action: "VIEW",
          category: ["DEFAULT", "BROWSABLE"],
          data: {
            scheme: "darapo"
          }
        }
      ]
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera for taking photos."
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos for sharing.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos to your gallery."
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 34,
            buildToolsVersion: "35.0.0"
          },
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ]
    ],
    extra: {
      // 런타임에서 접근할 수 있는 환경변수
      // 백엔드 중심 OAuth - 프론트엔드에서는 API URL만 필요
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
      // 레거시 카카오 키들은 제거됨 (모든 OAuth 처리는 백엔드에서)
    }
  }
};
