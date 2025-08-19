import React, { memo } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';

const colors = { text: '#2c3e50', subText: '#7f8c8d' } as const;
const spacing = { lg: 16, xl: 24, md: 12, sm: 8 } as const;
const typography = { h2: 20, body: 16 } as const;

export type EmptyStateProps = {
  icon?: string | React.ReactNode;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;        // 컨테이너 외부 마진 등
  contentStyle?: StyleProp<ViewStyle>; // 내부 여백 커스터마이즈
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

const BaseEmptyState: React.FC<EmptyStateProps> = ({
  icon = '📸',
  title,
  subtitle,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.content, contentStyle]}>
        {typeof icon === 'string' ? <Text style={styles.icon}>{icon}</Text> : icon}
        <Text style={[styles.title, titleStyle]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export const EmptyState = memo(BaseEmptyState);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    maxWidth: 560, // 너무 넓어지지 않게
    width: '100%',
  },
  icon: {
    fontSize: 72,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EmptyState;