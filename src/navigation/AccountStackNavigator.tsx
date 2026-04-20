import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountScreen } from '../screens/app/AccountScreen';
import { AccountStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AccountStackParamList>();

export function AccountStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AccountMain" component={AccountScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
