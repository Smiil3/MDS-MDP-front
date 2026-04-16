import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../../context/auth/AuthContext';
import { AuthRole } from '../../types/auth';
import { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const roleLabels: Record<AuthRole, string> = {
  driver: 'Particulier',
  mechanic: 'Garage',
};

export function LoginScreen({ navigation, route }: Props) {
  const { login } = useAuth();
  const role = route.params.role;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationError = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return 'Email and password are required.';
    }

    if (!email.includes('@')) {
      return 'Please enter a valid email.';
    }

    if (password.length < 6) {
      return 'Password must contain at least 6 characters.';
    }

    return null;
  }, [email, password]);

  const onSubmit = async () => {
    setError(null);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await login(role, email.trim(), password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Connexion en tant que {roleLabels[role]}.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable onPress={onSubmit} disabled={isSubmitting} style={styles.submitButton}>
        <Text style={styles.submitText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('RegisterAccountType')}>
        <Text style={styles.link}>No account? Create one</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  submitButton: {
    marginTop: 4,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    color: '#dc2626',
  },
  link: {
    marginTop: 4,
    textAlign: 'center',
    color: '#1d4ed8',
    fontWeight: '600',
  },
});
