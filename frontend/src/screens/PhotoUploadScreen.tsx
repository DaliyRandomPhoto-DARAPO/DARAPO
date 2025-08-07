import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type PhotoUploadScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhotoUpload'>;
type PhotoUploadScreenRouteProp = RouteProp<RootStackParamList, 'PhotoUpload'>;

const PhotoUploadScreen = () => {
  const navigation = useNavigation<PhotoUploadScreenNavigationProp>();
  const route = useRoute<PhotoUploadScreenRouteProp>();
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const { photoUri } = route.params;

  const handleUpload = async () => {
    if (!photoUri) {
      Alert.alert('오류', '사진이 선택되지 않았습니다.');
      return;
    }

    setIsUploading(true);
    
    try {
      // TODO: 실제 업로드 로직 구현
      console.log('업로드할 사진:', photoUri);
      console.log('코멘트:', comment);
      
      Alert.alert('성공', '사진이 업로드되었습니다!', [
        { text: '확인', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (error) {
      Alert.alert('오류', '업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleShare = () => {
    Alert.alert('공유', 'SNS 공유 기능을 구현합니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        )}
        
        <View style={styles.missionInfo}>
          <Text style={styles.missionLabel}>미션</Text>
          <Text style={styles.missionText}>오늘의 노란색 찾기</Text>
        </View>

        <TextInput
          style={styles.commentInput}
          placeholder="코멘트를 입력하세요 (선택사항)"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={200}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton]} 
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>
              {isUploading ? '업로드 중...' : '📤 업로드'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.shareButton]} 
            onPress={handleShare}
          >
            <Text style={styles.buttonText}>📱 SNS 공유</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  missionInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  missionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  missionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  commentInput: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PhotoUploadScreen;
