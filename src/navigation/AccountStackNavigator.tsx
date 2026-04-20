import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountScreen } from '../screens/app/AccountScreen';
import { MyBookingsScreen } from '../screens/app/MyBookingsScreen';
import { AccountStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AccountStackParamList>();

export function AccountStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AccountMain" component={AccountScreen} options={{ title: 'Compte' }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'Mes réservations' }} />
    </Stack.Navigator>
  );
}
