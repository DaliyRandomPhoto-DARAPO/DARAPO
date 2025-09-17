import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';

export const UpdateChecker: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      // 개발 모드에서는 업데이트 체크 안함
      return;
    }

    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        // 업데이트가 있을 때 사용자에게 알림
        showUpdateAlert();
      }
    } catch (error) {
      console.log('업데이트 확인 실패:', error);
    }
  };

  const showUpdateAlert = () => {
    Alert.alert(
      '새로운 업데이트',
      '앱의 새로운 버전이 있습니다. 지금 업데이트하시겠습니까?',
      [
        {
          text: '나중에',
          style: 'cancel',
        },
        {
          text: '업데이트',
          onPress: downloadAndRestart,
        },
      ]
    );
  };

  const downloadAndRestart = async () => {
    try {
      setIsUpdating(true);
      
      // 업데이트 다운로드
      await Updates.fetchUpdateAsync();
      
      // 앱 재시작하여 업데이트 적용
      await Updates.reloadAsync();
    } catch (error) {
      console.log('업데이트 다운로드 실패:', error);
      Alert.alert('업데이트 실패', '업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 수동 업데이트 체크 함수 (필요시 사용)
  const manualUpdateCheck = async () => {
    if (__DEV__) {
      Alert.alert('개발 모드', '개발 모드에서는 업데이트를 사용할 수 없습니다.');
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        showUpdateAlert();
      } else {
        Alert.alert('최신 버전', '이미 최신 버전을 사용하고 있습니다.');
      }
    } catch (error) {
      Alert.alert('확인 실패', '업데이트 확인 중 오류가 발생했습니다.');
    }
  };

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};

export { Updates };