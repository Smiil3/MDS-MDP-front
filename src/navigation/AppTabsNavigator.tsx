import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AccountStackNavigator } from './AccountStackNavigator';
import { HomeStackNavigator } from './HomeStackNavigator';
import { MyBookingsScreen } from '../screens/app/MyBookingsScreen';
import { AppTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabsNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: 'Accueil', headerShown: false }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{ title: 'Mes réservations', headerShown: false }}
      />
      <Tab.Screen name="Account" component={AccountStackNavigator} options={{ title: 'Compte', headerShown: false }} />
    </Tab.Navigator>
  );
}
