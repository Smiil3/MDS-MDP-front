import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';

type RootTabParamList = {
  Accueil: undefined;
  Exemple: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Bienvenue sur mds-mdp-mobile</Text>
      <Text style={styles.subtitle}>Ceci est la page d'accueil.</Text>
    </View>
  );
}

function ExampleScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Page d'exemple</Text>
      <Text style={styles.subtitle}>Navigation Bottom Tabs fonctionnelle.</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          tabBarActiveTintColor: '#2563eb',
        }}
      >
        <Tab.Screen name="Accueil" component={HomeScreen} />
        <Tab.Screen name="Exemple" component={ExampleScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
});
