import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BookingScreen } from '../screens/app/BookingScreen';
import { GarageDetailsScreen } from '../screens/app/GarageDetailsScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { HomeStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeList" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GarageDetails" component={GarageDetailsScreen} options={{ title: 'Détails garage' }} />
      <Stack.Screen name="BookingScreen" component={BookingScreen} options={{ title: 'Réservation' }} />
    </Stack.Navigator>
  );
}
