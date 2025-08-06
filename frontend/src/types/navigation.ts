export type RootStackParamList = {
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
