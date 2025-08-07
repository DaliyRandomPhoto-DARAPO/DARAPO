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
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
      kakaoAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
    },
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
        NSPhotoLibraryUsageDescription: "This app needs access to photo library to save and share photos."
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
            manifestPlaceholders: {
              KAKAO_APP_KEY: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
            }
          },
          ios: {
            infoPlist: {
              CFBundleURLTypes: [
                {
                  CFBundleURLName: "kakao",
                  CFBundleURLSchemes: [`kakao${process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY}`]
                }
              ],
              LSApplicationQueriesSchemes: [
                "kakaokompassauth",
                "kakaolink",
                `kakao${process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY}`
              ]
            }
          }
        }
      ]
    ],
    extra: {
      // 런타임에서 접근할 수 있는 환경변수
      kakaoAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
    }
  }
};
