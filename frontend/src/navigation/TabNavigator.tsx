import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { TabParamList } from '../types/navigation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  // Back handling is implemented globally in AppNavigator.
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const shortest = Math.min(width, height);
  const isSmallDevice = shortest < 360; // iPhone SE/mini, 일부 Android 소형 기기
  const isExtraSmall = shortest < 330; // 극소형: 라벨 숨김

  // 실서비스 앱 기준 기본 바 높이: iOS 49pt, Android 56dp
  const BASE_BAR_HEIGHT = Platform.select({ ios: 49, android: 56, default: 56 })!;
  // 가로모드에선 시스템이 공간을 절약하므로 낮춤
  const adjustedBaseHeight = isLandscape ? Math.max(40, BASE_BAR_HEIGHT - 8) : BASE_BAR_HEIGHT;
  const bottomInset = insets?.bottom ?? 0;
  // 총 높이 = 기본 높이 + 안전영역. 내부 패딩은 살짝 줄여 시각적 균형 유지
  const barHeight = adjustedBaseHeight + bottomInset;
  const paddingBottom = bottomInset > 0 ? Math.max(6, bottomInset - 2) : 8;
  const paddingTop = isSmallDevice ? 4 : 6;
  const labelFontSize = Platform.select({ ios: isSmallDevice ? 11 : 12, android: isSmallDevice ? 10 : 12, default: 12 })!;
  const baseIcon = Platform.select({ ios: 26, android: 24, default: 24 })!;
  const iconSize = isSmallDevice ? Math.max(20, baseIcon - 2) : baseIcon;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: barHeight,
          paddingTop,
          paddingBottom,
          // iOS: 얇은 상단 경계선, 그림자 최소화 / Android: 엘리베이션 위주
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 0,
          borderTopColor: '#e9ecef',
          elevation: Platform.OS === 'android' ? 10 : 0,
          shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
          shadowOpacity: Platform.OS === 'ios' ? 0.04 : 0,
          shadowRadius: Platform.OS === 'ios' ? 6 : 0,
          shadowOffset: Platform.OS === 'ios' ? { width: 0, height: -2 } : { width: 0, height: 0 },
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarLabelStyle: {
          display: isExtraSmall ? 'none' : 'flex',
          fontSize: labelFontSize,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarAllowFontScaling: true,
        tabBarItemStyle: {
          // 아이콘/라벨 수직 정렬 안정화
          paddingHorizontal: 6,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        // iOS에서 네이티브 느낌의 블러 배경 적용
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView tint="extraLight" intensity={30} style={{ flex: 1 }} />
          ) : null
        ),
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Feed') iconName = focused ? 'images' : 'images-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} color={color} size={iconSize} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: '메인',
        }}
      />
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarLabel: '피드',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: '프로필',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
