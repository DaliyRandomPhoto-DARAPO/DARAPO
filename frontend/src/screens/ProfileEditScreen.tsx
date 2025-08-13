import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, Alert, Image, TouchableOpacity, ActionSheetIOS, Platform } from 'react-native';
import Header from '../ui/Header';
import Button from '../ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { userAPI, BASE_URL } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

const colors = { background: '#f8f9fa', surface: '#ffffff', text: '#2c3e50', subText: '#7f8c8d', primary: '#3498db' } as const;
const spacing = { xl: 24, lg: 16, md: 12, sm: 8 } as const;
const typography = { h1: 24, body: 16, small: 14 } as const;

export default function ProfileEditScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [profileImage, setProfileImage] = useState(user?.profileImage ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await userAPI.updateMe({ nickname, profileImage });
      await updateProfile({ nickname: updated.nickname, profileImage: updated.profileImage });
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('저장 실패', '프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '프로필 이미지를 등록하려면 사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    try {
      setSaving(true);
      const uri = asset.uri;
      const guessName = (() => {
        const parts = uri.split(/[\/]/);
        const last = parts[parts.length - 1] || 'avatar.jpg';
        return last.includes('.') ? last : `${last}.jpg`;
      })();
      const lower = guessName.toLowerCase();
      let type = 'image/jpeg';
      if (lower.endsWith('.png')) type = 'image/png';
      else if (lower.endsWith('.heic')) type = 'image/heic';
      const resp = await userAPI.uploadAvatar({ uri, name: guessName, type });
      setProfileImage(resp.imageUrl);
      await updateProfile({ profileImage: resp.imageUrl });
      Alert.alert('업로드 완료', '프로필 이미지가 업데이트되었습니다.');
    } catch (e) {
      Alert.alert('업로드 실패', '이미지 업로드에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const onPressAvatar = () => {
    const doReset = async () => {
      try {
        setSaving(true);
        const resp = await userAPI.resetAvatar();
        setProfileImage(resp.imageUrl ?? '');
        await updateProfile({ profileImage: resp.imageUrl ?? undefined });
        Alert.alert('변경 완료', '기본 이미지로 변경되었습니다.');
      } catch (e) {
        Alert.alert('실패', '기본 이미지로 변경에 실패했습니다.');
      } finally {
        setSaving(false);
      }
    };

    const pick = () => {
      pickAvatar();
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '기본 이미지로 변경', '사진첩에서 선택'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (index) => {
          if (index === 1) doReset();
          else if (index === 2) pick();
        }
      );
    } else {
      Alert.alert('프로필 이미지', '작업을 선택하세요', [
        { text: '기본 이미지로 변경', onPress: doReset, style: 'destructive' },
        { text: '사진첩에서 선택', onPress: pick },
        { text: '취소', style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="프로필 수정" />
      <View style={styles.content}>
  <TouchableOpacity onPress={onPressAvatar} activeOpacity={0.8} style={{ alignSelf: 'center' }}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage.startsWith('http') ? profileImage : `${BASE_URL}${profileImage}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>사진 선택</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>프로필 이미지를 변경하려면 위 이미지를 탭하세요</Text>
        <Text style={styles.label}>닉네임</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={(text) => {
            // 영문/숫자/한글(자모 포함)/공백만 허용
            const sanitized = text.replace(/[^0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ ]+/g, '');
            setNickname(sanitized);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          placeholder="닉네임"
        />
        <Text style={styles.helper}>특수문자는 입력할 수 없습니다.</Text>
        <View style={{ height: spacing.lg }} />
        <Button title={saving ? '저장 중…' : '저장'} onPress={handleSave} fullWidth size="lg" disabled={saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  label: { color: colors.subText, marginTop: spacing.md, marginBottom: spacing.sm, fontSize: typography.small },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, fontSize: typography.body },
  helper: { color: colors.subText, fontSize: typography.small, marginTop: 6 },
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: spacing.sm },
  hint: { textAlign: 'center', color: colors.subText, marginBottom: spacing.lg, fontSize: typography.small },
});
