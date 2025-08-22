import React from 'react';
import { ScrollView, Text, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import Header from '../ui/Header';

// Local tokens
const colors = { background: '#f8f9fa', text: '#2c3e50', subText: '#7f8c8d', link: '#2563eb' } as const;
const spacing = { xl: 24, lg: 16, sm: 8 } as const;
const typography = { h1: 24, body: 16, small: 14 } as const;

const CONTACT_EMAIL = 'hhee200456@gmail.com';
const LAST_UPDATED = '2025-08-13';

const PrivacyScreen = () => {
  const onPressEmail = () => Linking.openURL(`mailto:${CONTACT_EMAIL}`);

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <Header title="개인정보처리방침" />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Privacy Policy for darapo – Daily Random Photo</Text>
        <Text style={styles.caption}>시행일: {LAST_UPDATED}</Text>

        <View style={{ height: spacing.xl }} />

        <Text style={styles.sectionTitle}>1. 수집하는 정보</Text>
        <Text style={styles.body}>• 카카오 로그인: 카카오 계정 식별자(kakaoId), 닉네임, 프로필 이미지(선택), 이메일(선택)</Text>
        <Text style={styles.body}>• 사용자가 업로드한 사진: 서버 및 AWS S3에 저장되어 미션 제공 및 피드 노출에 사용</Text>
        <Text style={styles.body}>• 서비스 운영 로그: 오류/접속 등 최소 로그(개인 식별 최소화)</Text>

        <Text style={styles.sectionTitle}>2. 이용 목적</Text>
        <Text style={styles.body}>• 회원 식별 및 인증, 서비스 제공(미션·사진 업로드·피드 제공)</Text>
        <Text style={styles.body}>• 오류 분석 및 보안/안정성 향상(서비스 품질 개선)</Text>

        <Text style={styles.sectionTitle}>3. 보관 및 파기</Text>
        <Text style={styles.body}>• 이용자가 탈퇴 요청(앱 내 ‘설정 → 탈퇴’ 또는 문의) 시, 계정 정보 및 사용자가 업로드한 사진(S3 객체 포함)을 삭제</Text>
        <Text style={styles.body}>• 백업/로그 또는 법적 보관 의무가 있는 경우를 제외하고 지체 없이 파기하며, 잔여 데이터는 <Text style={{fontWeight:'700'}}>통상 30일 이내</Text> 완전 파기</Text>

        <Text style={styles.sectionTitle}>4. 제3자 제공 및 처리위탁</Text>
        <Text style={styles.body}>• 제3자 제공: 법령 근거 또는 동의가 있는 경우에 한함(일반 제공 없음)</Text>
        <Text style={styles.body}>• 처리위탁: 이미지 저장/전송을 위해 AWS S3를 사용, 소셜 로그인을 위해 카카오를 사용(필요한 범위의 프로필 정보가 제공될 수 있음)</Text>

        <Text style={styles.sectionTitle}>5. 이용자의 권리</Text>
        <Text style={styles.body}>• 열람, 정정, 삭제(탈퇴), 처리정지 요구 가능</Text>
        <Text style={styles.body}>• 앱 내 ‘설정 → 탈퇴’ 또는 아래 연락처로 요청</Text>

        <Text style={styles.sectionTitle}>6. 정보보안</Text>
        <Text style={styles.body}>• 전송 구간 암호화(TLS), 접근 통제, 최소 권한 등 합리적 보호 조치 적용</Text>

        <Text style={styles.sectionTitle}>7. 개인정보처리방침 변경</Text>
        <Text style={styles.body}>• 본 방침은 변경될 수 있으며, 변경 시 앱 내 공지 및 공개 페이지를 통해 고지</Text>

        <Text style={styles.sectionTitle}>8. 계정 삭제 방법</Text>
        <Text style={styles.body}>• 앱 내 <Text style={{fontWeight:'700'}}>설정 → 탈퇴</Text>에서 계정 및 관련 데이터 삭제 가능</Text>
        <Text style={styles.body}>• <Text style={{fontWeight:'700'}}>삭제되는 데이터</Text>: 카카오 식별자(kakaoId), 닉네임/프로필 이미지, 선택 수집 이메일, 사용자가 업로드한 사진, 서비스 운영 로그</Text>
        <Text style={styles.body}>• <Text style={{fontWeight:'700'}}>처리 시점</Text>: 탈퇴 즉시 서비스 내 비활성/삭제 처리, 백업/로그 등 잔여 데이터는 <Text style={{fontWeight:'700'}}>30일 이내</Text> 완전 파기(법적 보관은 예외적으로 최소 범위 유지)</Text>
        <Text style={styles.body}>• 앱 이용이 어려운 경우 이메일로 계정 삭제 요청 가능</Text>

        <View style={{ height: spacing.lg }} />
        <Pressable onPress={onPressEmail} accessibilityRole="link">
          <Text style={[styles.body, styles.link]}>문의: {CONTACT_EMAIL}</Text>
        </Pressable>

        <View style={{ height: spacing.xl }} />
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
  link: { color: colors.link, textDecorationLine: 'underline' },
});

export default PrivacyScreen;
