import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';

// Local tokens
const colors = { background: '#f8f9fa', text: '#2c3e50', subText: '#7f8c8d' } as const;
const spacing = { xl: 24, lg: 16, sm: 8 } as const;
const typography = { h1: 24, body: 16, small: 14 } as const;

const PrivacyScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="개인정보처리방침" />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Privacy Policy for darapo – Daily Random Photo</Text>
        <Text style={styles.caption}>시행일: 2025년 8월 13일</Text>

        <View style={{ height: spacing.xl }} />

        <Text style={styles.sectionTitle}>1. 수집하는 정보</Text>
        <Text style={styles.body}>• 본 앱은 사진 제공을 위해 외부 이미지 API를 사용합니다.</Text>
        <Text style={styles.body}>• 로그인, 이메일, 위치정보, 기기식별정보 등 개인 식별 정보는 수집하지 않습니다.</Text>
        <Text style={styles.body}>• 앱 사용 로그나 행동 데이터는 수집하지 않습니다.</Text>
        <Text style={styles.body}>• 앱 이용 과정에서 서버에 사진 데이터 및 필요한 최소한의 서비스 운영 데이터(예: 사진 호출 이력)가 저장될 수 있습니다. 이 데이터에는 개인 식별 정보가 포함되지 않습니다.</Text>

        <Text style={styles.sectionTitle}>2. 정보의 이용 목적</Text>
        <Text style={styles.body}>• 서버 저장 데이터는 사진 제공 및 서비스 품질 유지, 안정적인 운영을 위해서만 사용됩니다.</Text>

        <Text style={styles.sectionTitle}>3. 정보 보관 및 보안</Text>
        <Text style={styles.body}>• 저장되는 데이터는 암호화 또는 접근 제한 등 적절한 보안 조치를 거쳐 보관됩니다.</Text>
        <Text style={styles.body}>• 불필요한 데이터는 일정 기간 후 파기합니다.</Text>

        <Text style={styles.sectionTitle}>4. 제3자 제공</Text>
        <Text style={styles.body}>• 법률상 요구되는 경우를 제외하고 제3자에게 정보를 제공하지 않습니다.</Text>

        <Text style={styles.sectionTitle}>5. 이용자의 권리</Text>
        <Text style={styles.body}>• 사용자는 서비스 내 제공되는 연락 수단을 통해 데이터 삭제를 요청할 수 있습니다.</Text>

        <Text style={styles.sectionTitle}>6. 개인정보처리방침 변경</Text>
        <Text style={styles.body}>• 본 방침은 필요 시 변경될 수 있으며, 변경 시 앱 내 공지 및 업데이트 설명을 통해 고지합니다.</Text>

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

export default PrivacyScreen;
