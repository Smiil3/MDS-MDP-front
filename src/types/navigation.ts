import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  GarageDetails: { garageId: number };
};

export type AppTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
