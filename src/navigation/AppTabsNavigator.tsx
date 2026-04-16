import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AccountScreen } from '../screens/app/AccountScreen';
import { HomeStackNavigator } from './HomeStackNavigator';
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
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Compte' }} />
    </Tab.Navigator>
  );
}
