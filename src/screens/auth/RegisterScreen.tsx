import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../../context/auth/AuthContext';
import { AuthRole, DriverRegisterPayload, MechanicRegisterPayload } from '../../types/auth';
import { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const roleLabels: Record<AuthRole, string> = {
  driver: 'Driver',
  mechanic: 'Mechanic',
};

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [role, setRole] = useState<AuthRole>('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');

  const [mechanicName, setMechanicName] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [siret, setSiret] = useState('');

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

    if (role === 'driver') {
      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !phone.trim() ||
        !birthDate.trim() ||
        !subscriptionId.trim()
      ) {
        return 'Please complete all driver fields.';
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
        return 'Birth date must be in YYYY-MM-DD format.';
      }

      if (!Number.isInteger(Number(subscriptionId)) || Number(subscriptionId) <= 0) {
        return 'Subscription id must be a positive integer.';
      }
    }

    if (role === 'mechanic') {
      if (
        !mechanicName.trim() ||
        !address.trim() ||
        !zipCode.trim() ||
        !city.trim() ||
        !siret.trim()
      ) {
        return 'Please complete all mechanic fields.';
      }

      if (!Number.isInteger(Number(zipCode)) || Number(zipCode) < 0) {
        return 'Zip code must be a valid number.';
      }
    }

    return null;
  }, [
    email,
    password,
    role,
    firstName,
    lastName,
    phone,
    birthDate,
    subscriptionId,
    mechanicName,
    address,
    zipCode,
    city,
    siret,
  ]);

  const onSubmit = async () => {
    setError(null);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      if (role === 'driver') {
        const payload: DriverRegisterPayload = {
          role: 'driver',
          email: email.trim(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          birth_date: `${birthDate.trim()}T00:00:00.000Z`,
          id_subscription: Number(subscriptionId),
        };
        await register(payload);
      } else {
        const payload: MechanicRegisterPayload = {
          role: 'mechanic',
          email: email.trim(),
          password,
          name: mechanicName.trim(),
          address: address.trim(),
          zip_code: Number(zipCode),
          city: city.trim(),
          description: description.trim() || undefined,
          siret: siret.trim(),
        };
        await register(payload);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Register failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Register as driver or mechanic.</Text>

      <View style={styles.roleRow}>
        {(Object.keys(roleLabels) as AuthRole[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setRole(value)}
            style={[styles.roleButton, role === value && styles.roleButtonActive]}
          >
            <Text style={[styles.roleText, role === value && styles.roleTextActive]}>
              {roleLabels[value]}
            </Text>
          </Pressable>
        ))}
      </View>

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

      {role === 'driver' ? (
        <>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            style={styles.input}
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            style={styles.input}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            style={styles.input}
          />
          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="Birth date (YYYY-MM-DD)"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={subscriptionId}
            onChangeText={setSubscriptionId}
            placeholder="Subscription ID"
            keyboardType="numeric"
            style={styles.input}
          />
        </>
      ) : (
        <>
          <TextInput
            value={mechanicName}
            onChangeText={setMechanicName}
            placeholder="Garage name"
            style={styles.input}
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Address"
            style={styles.input}
          />
          <TextInput
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="Zip code"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput value={city} onChangeText={setCity} placeholder="City" style={styles.input} />
          <TextInput value={siret} onChangeText={setSiret} placeholder="SIRET" style={styles.input} />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            multiline
            style={[styles.input, styles.multilineInput]}
          />
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable onPress={onSubmit} disabled={isSubmitting} style={styles.submitButton}>
        <Text style={styles.submitText}>{isSubmitting ? 'Creating...' : 'Create account'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  roleText: {
    color: '#334155',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#1d4ed8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
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
    marginBottom: 20,
  },
});
