import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GarageDetailsScreen } from '../screens/app/GarageDetailsScreen';
import { HomeScreen } from '../screens/app/HomeScreen';
import { HomeStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeList" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Stack.Screen name="GarageDetails" component={GarageDetailsScreen} options={{ title: 'Détails garage' }} />
    </Stack.Navigator>
  );
}
