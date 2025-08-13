import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { theme } from '../ui/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

const colors = { ...theme.colors, primary: '#7C3AED' } as const;
const { spacing, typography, radii } = theme;

const UploadResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'UploadResult'>>();
  const replaced = route.params?.replaced === true;
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title={replaced ? '사진 교체 완료' : '업로드 완료'} />
      <View style={styles.content}>
        <Card style={styles.resultCard}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>
            {replaced ? '오늘 사진이 새 사진으로 교체되었어요' : '사진이 성공적으로 업로드되었어요'}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button title="내 사진 보기" onPress={() => navigation.navigate('MyPhotos')} size="lg" fullWidth />
            <Button title="다시 찍기" variant="outline" size="lg" fullWidth onPress={() => navigation.navigate('Camera')} />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  resultCard: { width: '100%', maxWidth: 520, alignItems: 'center', gap: spacing.md, padding: spacing.xl, borderRadius: radii.lg },
  emoji: { fontSize: 64 },
  title: { fontSize: typography.h1, color: colors.text, textAlign: 'center' },
});

export default UploadResultScreen;
