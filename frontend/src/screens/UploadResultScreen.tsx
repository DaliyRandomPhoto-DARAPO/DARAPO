import React from 'react';
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import Header from '../ui/Header';
import Button from '../ui/Button';
import { colors, spacing, typography } from '../ui/theme';
import { useNavigation } from '@react-navigation/native';

const UploadResultScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.container}>
      <Header title="업로드 완료" />
      <View style={styles.content}>
        <Text style={styles.emoji}>✅</Text>
        <Text style={styles.title}>사진이 성공적으로 업로드되었어요</Text>
        <Button title="내 사진 보기" onPress={() => navigation.navigate('MyPhotos')} style={{ marginTop: spacing.md }} />
        <Button title="다시 찍기" variant="outline" onPress={() => navigation.navigate('Camera')} style={{ marginTop: spacing.sm }} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: { fontSize: typography.h1, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
});

export default UploadResultScreen;
