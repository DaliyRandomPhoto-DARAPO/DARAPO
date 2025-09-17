import Constants from 'expo-constants';

const isDev = __DEV__ || Constants.expoConfig?.extra?.isDev;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Error는 프로덕션에서도 출력 (중요한 오류)
    console.error(...args);
  },
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};