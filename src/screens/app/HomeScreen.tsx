import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../context/auth/AuthContext';

export function HomeScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authenticated Home</Text>
      <Text style={styles.subtitle}>Role: {user?.role}</Text>
      <Text style={styles.subtitle}>Email: {user?.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#334155',
  },
});
