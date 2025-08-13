import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';
import Button from '../ui/Button';

// Local tokens
const colors = { background: '#f8f9fa', text: '#2c3e50' } as const;
const spacing = { xl: 24, lg: 16, md: 12, sm: 8 } as const;
const typography = { h1: 24 } as const;
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

const UploadResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'UploadResult'>>();
  const replaced = route.params?.replaced === true;
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title={replaced ? '사진 교체 완료' : '업로드 완료'} />
        <View style={styles.content}>
          <Text style={styles.emoji}>✅</Text>
            <Text style={styles.title}>
              {replaced ? '오늘 사진이 새 사진으로 교체되었어요' : '사진이 성공적으로 업로드되었어요'}
            </Text>
            <Button title="내 사진 보기" onPress={() => navigation.navigate('MyPhotos')} size="lg" fullWidth style={{ marginTop: spacing.md }} />
            <Button title="다시 찍기" variant="outline" size="lg" fullWidth onPress={() => navigation.navigate('Camera')} style={{ marginTop: spacing.sm }} />
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: { fontSize: typography.h1, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
});

export default UploadResultScreen;
