export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Camera: undefined;
  PhotoUpload: {
    photoUri: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
