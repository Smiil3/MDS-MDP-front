import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';

import { AccountStackNavigator } from './AccountStackNavigator';
import { HomeStackNavigator } from './HomeStackNavigator';
import { MyBookingsScreen } from '../screens/app/MyBookingsScreen';
import { AppTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a3fa6',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? require('../../assets/images/home-active.png') : require('../../assets/images/home.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          title: 'Mes réservations',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? require('../../assets/images/resa-active.png') : require('../../assets/images/resa.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackNavigator}
        options={{
          title: 'Mon profil',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused ? require('../../assets/images/car.png') : require('../../assets/images/profile.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
