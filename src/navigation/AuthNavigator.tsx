import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthOnboardingProvider } from '../context/auth/AuthOnboardingContext';
import {
  LoginRoleSelectScreen,
  RegisterAccountTypeScreen,
} from '../screens/auth/AccountTypeChoiceScreen';
import {
  RegisterDriverBirthDateScreen,
  RegisterDriverEmailScreen,
  RegisterDriverIdentityScreen,
  RegisterDriverPasswordScreen,
  RegisterDriverPhoneScreen,
  RegisterDriverReviewScreen,
} from '../screens/auth/DriverRegisterScreens';
import {
  RegisterGarageAddressScreen,
  RegisterGarageCredentialsScreen,
  RegisterGarageHoursScreen,
  RegisterGarageInfoScreen,
  RegisterGarageReviewScreen,
  RegisterGarageServicesScreen,
} from '../screens/auth/GarageRegisterScreens';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingWelcomeScreen } from '../screens/auth/OnboardingWelcomeScreen';
import { AuthStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <AuthOnboardingProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="OnboardingWelcome"
          component={OnboardingWelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LoginRoleSelect"
          component={LoginRoleSelectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="RegisterAccountType"
          component={RegisterAccountTypeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="RegisterDriverEmail" component={RegisterDriverEmailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterDriverPassword" component={RegisterDriverPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterDriverIdentity" component={RegisterDriverIdentityScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterDriverPhone" component={RegisterDriverPhoneScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterDriverBirthDate" component={RegisterDriverBirthDateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterDriverReview" component={RegisterDriverReviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterGarageInfo" component={RegisterGarageInfoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterGarageAddress" component={RegisterGarageAddressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterGarageServices" component={RegisterGarageServicesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterGarageHours" component={RegisterGarageHoursScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterGarageCredentials" component={RegisterGarageCredentialsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterGarageReview" component={RegisterGarageReviewScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </AuthOnboardingProvider>
  );
}
