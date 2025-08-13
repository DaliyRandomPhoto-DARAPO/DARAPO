import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Local tokens
const colors = { text: '#2c3e50', subText: '#7f8c8d' } as const;
const spacing = { lg: 16, xl: 24, md: 12, sm: 8 } as const;
const typography = { h2: 20, body: 16 } as const;

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
};

export const EmptyState: React.FC<Props> = ({ icon = '📸', title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  paddingTop: spacing.xl,
  paddingBottom: spacing.lg,
  paddingHorizontal: spacing.lg,
  },
  icon: {
  fontSize: 72,
    marginBottom: spacing.md,
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
