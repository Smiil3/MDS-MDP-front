import { AuthRole } from './auth';
import { NavigatorScreenParams } from '@react-navigation/native';
import { GarageServices, OpeningHours } from './garage';

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
  BookingScreen: {
    garageId: number;
    mechanicId: number;
    garageName: string;
    garageAddress: string;
    garageCity: string;
    garageImageUrl: string | null;
    services: GarageServices | null;
    openingHours: OpeningHours | null;
  };
};

export type AppTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
