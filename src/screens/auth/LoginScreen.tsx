import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
      <Image source={require('../../../assets/images/logo-mecanoo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Welcome back !</Text>
      <Text style={styles.subtitle}>Tu te connectes en tant que {roleLabels[role]}.</Text>

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
        <Text style={styles.link}>Pas de compte ? Inscris-toi !</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B3E5FF',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  submitButton: {
    width: '100%',
    marginTop: 4,
    backgroundColor: '#2D3F8C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    color: '#7f1d1d',
    fontWeight: '600',
  },
  link: {
    marginTop: 4,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
});
