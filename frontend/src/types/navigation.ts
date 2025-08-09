export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Camera: undefined;
  PhotoUpload: {
    photoUri: string;
  };
  Terms: undefined;
  Privacy: undefined;
  Settings: undefined;
    MyPhotos: undefined;
    UploadResult: undefined;
};

export type TabParamList = {
  Home: undefined;
  Feed: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
