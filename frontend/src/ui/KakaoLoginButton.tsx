import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

type Props = {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
  testID?: string;
};

// Kakao Brand
const KAKAO_YELLOW = '#FEE500';
const KAKAO_BLACK = '#000000';

const KakaoLoginButton: React.FC<Props> = ({
  title = '카카오로 로그인',
  onPress,
  disabled,
  loading,
  fullWidth = true,
  style,
  accessibilityLabel,
  testID,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.button, { alignSelf: fullWidth ? 'stretch' : 'auto' }, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={KAKAO_BLACK} />
      ) : (
        <View style={styles.row}>
          {/* Fallback symbol (if you add an official KakaoTalk symbol image, replace this with <Image />) */}
          <View style={styles.symbol}>
            <Text style={styles.symbolText}>K</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: KAKAO_YELLOW,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  symbolText: { color: KAKAO_BLACK, fontWeight: '800' },
  title: {
    color: KAKAO_BLACK,
    fontSize: 17,
    fontWeight: '700',
  },
});

export default React.memo(KakaoLoginButton);
