import { AuthRole } from './auth';
import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  OnboardingWelcome: undefined;
  LoginRoleSelect: undefined;
  Login: { role: AuthRole };
  RegisterAccountType: undefined;
  RegisterDriverEmail: undefined;
  RegisterDriverPassword: undefined;
  RegisterDriverIdentity: undefined;
  RegisterDriverPhone: undefined;
  RegisterDriverBirthDate: undefined;
  RegisterDriverReview: undefined;
  RegisterGarageInfo: undefined;
  RegisterGarageAddress: undefined;
  RegisterGarageServices: undefined;
  RegisterGarageHours: undefined;
  RegisterGarageCredentials: undefined;
  RegisterGarageReview: undefined;
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
