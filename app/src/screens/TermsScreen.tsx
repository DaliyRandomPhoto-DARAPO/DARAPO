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
        <Text style={styles.title}>Terms of Service for darapo – Daily Random Photo</Text>
        <Text style={styles.caption}>시행일: 2025년 8월 13일</Text>

        <View style={{ height: spacing.xl }} />

        <Text style={styles.sectionTitle}>1. 서비스 내용</Text>
        <Text style={styles.body}>• darapo는 매일 1장의 랜덤 사진을 API를 통해 제공하는 서비스입니다.</Text>
        <Text style={styles.body}>• 회원가입이나 로그인 없이 이용 가능합니다.</Text>

        <Text style={styles.sectionTitle}>2. 서비스 이용</Text>
        <Text style={styles.body}>• 사용자는 관련 법령 및 본 약관을 준수해야 합니다.</Text>
        <Text style={styles.body}>• 서비스 이용 중 제공되는 사진은 개인적인 용도에 한하여 사용할 수 있습니다.</Text>

        <Text style={styles.sectionTitle}>3. 저작권</Text>
        <Text style={styles.body}>• 제공되는 사진은 저작권 문제가 없는 이미지 소스(API)를 통해 제공됩니다.</Text>
        <Text style={styles.body}>• 사용자는 제공된 사진을 무단 복제, 배포, 상업적으로 이용할 수 없습니다.</Text>

        <Text style={styles.sectionTitle}>4. 면책 조항</Text>
        <Text style={styles.body}>• 서비스는 제공되는 사진의 품질, 정확성, 완전성을 보장하지 않습니다.</Text>
        <Text style={styles.body}>• 서비스 중단, 데이터 손실, 네트워크 장애 등으로 인한 피해에 대해 책임을 지지 않습니다.</Text>

        <Text style={styles.sectionTitle}>5. 약관 변경</Text>
        <Text style={styles.body}>• 약관은 필요 시 변경될 수 있으며, 변경 시 앱 내 공지 또는 업데이트 설명을 통해 고지합니다.</Text>

        <View style={{ height: spacing.lg }} />
        <Text style={styles.body}>문의: hhee200456@gmail.com</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
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
