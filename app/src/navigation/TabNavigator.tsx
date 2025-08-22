import React, { useMemo, useCallback } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { TabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<TabParamList>();

// ------- helpers -------
const isIOS = Platform.OS === 'ios';

const ICONS: Record<
  keyof TabParamList,
  { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }
> = {
  Home: { on: 'home', onf: 'home' } as any, // placeholder to avoid TS noise (will be overridden)
  Feed: { on: 'images', off: 'images-outline' },
  Profile: { on: 'person', off: 'person-outline' },
};
// 위에서 실수 방지용으로 다시 정확히 지정
ICONS.Home = { on: 'home', off: 'home-outline' };

const getIconName = (routeName: keyof TabParamList, focused: boolean) =>
  focused ? ICONS[routeName].on : ICONS[routeName].off;

const IOSBlurBackground = () =>
  isIOS ? (
    <BlurView tint="extraLight" intensity={30} style={{ flex: 1 }} />
  ) : (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
  );

// ------- main -------
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const { barHeight, paddingTop, paddingBottom, labelFontSize, iconSize, isExtraSmall } =
    useMemo(() => {
      const isLandscape = width > height;
      const shortest = Math.min(width, height);
      const isSmallDevice = shortest < 360;
      const isExtraSmallLocal = shortest < 330;

      const BASE_BAR_HEIGHT = Platform.select({ ios: 49, android: 56, default: 56 })!;
      const adjustedBaseHeight = isLandscape ? Math.max(40, BASE_BAR_HEIGHT - 8) : BASE_BAR_HEIGHT;

      const bottomInset = insets?.bottom ?? 0;
      const totalBarHeight = adjustedBaseHeight + bottomInset;

      const padBottom = bottomInset > 0 ? Math.max(6, bottomInset - 2) : 8;
      const padTop = isSmallDevice ? 4 : 6;

      const labelSize = Platform.select({
        ios: isSmallDevice ? 11 : 12,
        android: isSmallDevice ? 10 : 12,
        default: 12,
      })!;

      const baseIcon = Platform.select({ ios: 26, android: 24, default: 24 })!;
      const icon = isSmallDevice ? Math.max(20, baseIcon - 2) : baseIcon;

      return {
        barHeight: totalBarHeight,
        paddingTop: padTop,
        paddingBottom: padBottom,
        labelFontSize: labelSize,
        iconSize: icon,
        isExtraSmall: isExtraSmallLocal,
      };
    }, [width, height, insets?.bottom]);

  const screenOptions = useCallback(
    ({ route }: { route: RouteProp<TabParamList, keyof TabParamList> }): BottomTabNavigationOptions => ({
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        height: barHeight,
        paddingTop,
        paddingBottom,
        // iOS: 얇은 상단 경계선 + 미세 그림자 / Android: elevation
        borderTopWidth: isIOS ? 0.5 : 0,
        borderTopColor: '#e9ecef',
        elevation: Platform.OS === 'android' ? 10 : 0,
        shadowColor: isIOS ? '#000' : 'transparent',
        shadowOpacity: isIOS ? 0.04 : 0,
        shadowRadius: isIOS ? 6 : 0,
        shadowOffset: isIOS ? { width: 0, height: -2 } : { width: 0, height: 0 },
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
        paddingHorizontal: 6,
      },
      tabBarIconStyle: { marginTop: 0 },

      // iOS 블러 배경
      tabBarBackground: IOSBlurBackground,

      tabBarIcon: (
        { focused, color }: { focused: boolean; color: string; size: number } // <- 타입 명시해서 any 경고 제거
      ) => {
        const iconName = getIconName(route.name as keyof TabParamList, focused);
        return <Ionicons name={iconName} color={color} size={iconSize} />;
      },
    }),
    [barHeight, paddingTop, paddingBottom, isExtraSmall, labelFontSize, iconSize]
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '메인' }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: '피드' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
