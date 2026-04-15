import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AccountScreen } from '../screens/app/AccountScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { AppTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabsNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Compte' }} />
    </Tab.Navigator>
  );
}
