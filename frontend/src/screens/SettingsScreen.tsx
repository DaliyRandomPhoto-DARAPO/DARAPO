import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../ui/Header';

// Local tokens
const colors = { background: '#f8f9fa', surface: '#ffffff', text: '#2c3e50' } as const;
const spacing = { md: 12, lg: 16 } as const;
const typography = { body: 16 } as const;
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="설정" />

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>푸시 알림</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.link}>이용약관</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Privacy')}>
          <Text style={styles.link}>개인정보처리방침</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: typography.body, color: colors.text },
  link: { fontSize: typography.body, color: colors.text },
  arrow: { fontSize: 20, color: '#bdc3c7' },
});

export default SettingsScreen;
