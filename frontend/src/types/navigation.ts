export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Camera: undefined;
  PhotoUpload: {
    photoUri: string;
  };
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
