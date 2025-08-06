import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

// Types
import { RootStackParamList } from './src/types/navigation';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import PhotoUploadScreen from './src/screens/PhotoUploadScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: '오늘의 미션' }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{ title: '사진 촬영' }}
          />
          <Stack.Screen 
            name="PhotoUpload" 
            component={PhotoUploadScreen} 
            options={{ title: '사진 업로드' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
      <StatusBar style="auto" />
    </>
  );
}
