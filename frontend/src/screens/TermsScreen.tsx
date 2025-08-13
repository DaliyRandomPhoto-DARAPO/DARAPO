import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';

// Local tokens
const colors = { background: '#f8f9fa', text: '#2c3e50', subText: '#7f8c8d' } as const;
const spacing = { xl: 24, lg: 16, sm: 8 } as const;
const typography = { h1: 24, body: 16, small: 14 } as const;

const TermsScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="이용약관" />
  <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>제1조 목적</Text>
        <Text style={styles.body}>
          본 약관은 DARAPO(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </Text>

        <Text style={styles.sectionTitle}>제2조 용어의 정의</Text>
        <Text style={styles.body}>본 약관에서 사용하는 용어의 정의는 관련 법령 및 서비스 안내에 따릅니다.</Text>

        <Text style={styles.sectionTitle}>제3조 약관의 게시와 개정</Text>
        <Text style={styles.body}>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</Text>

        <View style={{ height: spacing.xl }} />
        <Text style={styles.caption}>최종 업데이트: 2024-01-01</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  sectionTitle: {
    fontSize: typography.h1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  caption: { fontSize: typography.small, color: colors.subText },
});

export default TermsScreen;
