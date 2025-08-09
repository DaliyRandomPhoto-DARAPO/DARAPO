import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import Header from '../ui/Header';
import { colors, spacing, typography } from '../ui/theme';

const PrivacyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="개인정보처리방침" />
      <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.sectionTitle}>1. 수집하는 개인정보 항목</Text>
        <Text style={styles.body}>서비스 제공을 위해 카카오 계정 식별자, 닉네임 등을 수집할 수 있습니다.</Text>

        <Text style={styles.sectionTitle}>2. 개인정보의 이용 목적</Text>
        <Text style={styles.body}>회원 식별, 서비스 제공, 고객 문의 응대 등에 활용됩니다.</Text>

        <Text style={styles.sectionTitle}>3. 보유 및 이용기간</Text>
        <Text style={styles.body}>관련 법령에 따라 일정 기간 보관 후 파기합니다.</Text>

        <View style={{ height: spacing.xl }} />
        <Text style={styles.caption}>최종 업데이트: 2024-01-01</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
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

export default PrivacyScreen;
