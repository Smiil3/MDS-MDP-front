import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { useAuth } from '../../context/auth/AuthContext';
import { useAuthOnboarding } from '../../context/auth/AuthOnboardingContext';
import { DriverRegisterPayload } from '../../types/auth';
import { AuthStackParamList } from '../../types/navigation';
import { authSharedStyles, LabeledInput, WizardScreenLayout } from './onboarding/common';
import { ApiError } from '../../services/api/httpClient';

const toIsoBirthDate = (value: string) => `${value}T00:00:00.000Z`;

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

function useDriverValidation() {
  const { driver } = useAuthOnboarding();
  return useMemo(
    () => ({
      emailError: !driver.email.trim()
        ? 'Email requis.'
        : !driver.email.includes('@')
          ? 'Email invalide.'
          : null,
      passwordError:
        !driver.password.trim()
          ? 'Mot de passe requis.'
          : driver.password.length < 6
            ? 'Minimum 6 caractères.'
            : driver.password !== driver.passwordConfirmation
              ? 'Les mots de passe ne correspondent pas.'
              : null,
      identityError:
        !driver.firstName.trim() || !driver.lastName.trim()
          ? 'Prénom et nom sont requis.'
          : null,
      phoneError: !driver.phone.trim() ? 'Téléphone requis.' : null,
      birthDateError:
        !driver.birthDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(driver.birthDate)
          ? 'Choisis une date valide.'
          : null,
    }),
    [driver],
  );
}

type EmailProps = NativeStackScreenProps<AuthStackParamList, 'RegisterDriverEmail'>;

export function RegisterDriverEmailScreen({ navigation, route }: EmailProps) {
  const { driver, setDriver } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(route.params?.errorMessage ?? null);
  const { emailError } = useDriverValidation();

  const onNext = () => {
    if (emailError) {
      setError(emailError);
      return;
    }
    navigation.navigate('RegisterDriverPassword');
  };

  return (
    <WizardScreenLayout
      title="Ton email"
      subtitle="Étape 1/6"
      stepLabel="Particulier"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <LabeledInput
        label="Email"
        value={driver.email}
        onChangeText={(value) => {
          setError(null);
          setDriver({ email: value });
        }}
        placeholder="email@exemple.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

type PasswordProps = NativeStackScreenProps<AuthStackParamList, 'RegisterDriverPassword'>;

export function RegisterDriverPasswordScreen({ navigation }: PasswordProps) {
  const { driver, setDriver } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const { passwordError } = useDriverValidation();

  const onNext = () => {
    if (passwordError) {
      setError(passwordError);
      return;
    }
    navigation.navigate('RegisterDriverIdentity');
  };

  return (
    <WizardScreenLayout
      title="Ton mot de passe"
      subtitle="Étape 2/6"
      stepLabel="Particulier"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <LabeledInput
        label="Mot de passe"
        value={driver.password}
        onChangeText={(value) => {
          setError(null);
          setDriver({ password: value });
        }}
        placeholder="Au moins 6 caractères"
        secureTextEntry
      />
      <LabeledInput
        label="Confirmation"
        value={driver.passwordConfirmation}
        onChangeText={(value) => {
          setError(null);
          setDriver({ passwordConfirmation: value });
        }}
        placeholder="Répéter le mot de passe"
        secureTextEntry
      />
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

type IdentityProps = NativeStackScreenProps<AuthStackParamList, 'RegisterDriverIdentity'>;

export function RegisterDriverIdentityScreen({ navigation }: IdentityProps) {
  const { driver, setDriver } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const { identityError } = useDriverValidation();

  const onNext = () => {
    if (identityError) {
      setError(identityError);
      return;
    }
    navigation.navigate('RegisterDriverPhone');
  };

  return (
    <WizardScreenLayout
      title="Ton identité"
      subtitle="Étape 3/6"
      stepLabel="Particulier"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <LabeledInput
        label="Prénom"
        value={driver.firstName}
        onChangeText={(value) => {
          setError(null);
          setDriver({ firstName: value });
        }}
      />
      <LabeledInput
        label="Nom"
        value={driver.lastName}
        onChangeText={(value) => {
          setError(null);
          setDriver({ lastName: value });
        }}
      />
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

type PhoneProps = NativeStackScreenProps<AuthStackParamList, 'RegisterDriverPhone'>;

export function RegisterDriverPhoneScreen({ navigation }: PhoneProps) {
  const { driver, setDriver } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const { phoneError } = useDriverValidation();

  const onNext = () => {
    if (phoneError) {
      setError(phoneError);
      return;
    }
    navigation.navigate('RegisterDriverBirthDate');
  };

  return (
    <WizardScreenLayout
      title="Ton téléphone"
      subtitle="Étape 4/6"
      stepLabel="Particulier"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <LabeledInput
        label="Téléphone"
        value={driver.phone}
        onChangeText={(value) => {
          setError(null);
          setDriver({ phone: value });
        }}
        keyboardType="phone-pad"
      />
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

type BirthProps = NativeStackScreenProps<AuthStackParamList, 'RegisterDriverBirthDate'>;

export function RegisterDriverBirthDateScreen({ navigation }: BirthProps) {
  const { driver, setDriver } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    driver.birthDate ? new Date(driver.birthDate) : new Date('1990-01-01'),
  );
  const { birthDateError } = useDriverValidation();

  const onDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    if (!value) {
      setPickerOpen(false);
      return;
    }
    setSelectedDate(value);
    setDriver({ birthDate: formatDate(value) });
    if (Platform.OS !== 'ios') {
      setPickerOpen(false);
    }
  };

  const onNext = () => {
    if (birthDateError) {
      setError(birthDateError);
      return;
    }
    navigation.navigate('RegisterDriverReview');
  };

  return (
    <WizardScreenLayout
      title="Ta date de naissance"
      subtitle="Étape 5/6"
      stepLabel="Particulier"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      {Platform.OS === 'web' ? (
        <LabeledInput
          label="Date de naissance (YYYY-MM-DD)"
          value={driver.birthDate}
          onChangeText={(value) => {
            setError(null);
            setDriver({ birthDate: value });
          }}
          placeholder="1990-12-31"
        />
      ) : (
        <>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Date de naissance</Text>
          <Pressable
            onPress={() => setPickerOpen((value) => !value)}
            style={authSharedStyles.secondaryButton}
          >
            <Text style={authSharedStyles.secondaryButtonText}>
              {driver.birthDate || 'Choisir une date'}
            </Text>
          </Pressable>
          {pickerOpen ? (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          ) : null}
        </>
      )}
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

type ReviewProps = NativeStackScreenProps<AuthStackParamList, 'RegisterDriverReview'>;

export function RegisterDriverReviewScreen({ navigation }: ReviewProps) {
  const { driver, resetDriver, setSelectedAccountType } = useAuthOnboarding();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validation = useDriverValidation();

  const onSubmit = async () => {
    const firstError =
      validation.emailError ||
      validation.passwordError ||
      validation.identityError ||
      validation.phoneError ||
      validation.birthDateError;
    if (firstError) {
      setError(firstError);
      return;
    }

    const payload: DriverRegisterPayload = {
      role: 'driver',
      email: driver.email.trim(),
      password: driver.password,
      first_name: driver.firstName.trim(),
      last_name: driver.lastName.trim(),
      phone: driver.phone.trim(),
      birth_date: toIsoBirthDate(driver.birthDate),
    };

    try {
      setIsSubmitting(true);
      await register(payload);
      resetDriver();
      setSelectedAccountType(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Inscription impossible.');

      if (submitError instanceof ApiError && submitError.status === 409) {
        navigation.navigate('RegisterDriverEmail', { errorMessage: 'Un compte existe déjà avec ce mail.' });
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Inscription impossible.');
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#B8DEF5' }} contentContainerStyle={{ paddingBottom: 24 }}>
      <WizardScreenLayout
        title="Confirmation"
        subtitle="Étape 6/6"
        stepLabel="Particulier"
        canGoBack
        onGoBack={() => navigation.goBack()}
      >
        <View style={driverReviewStyles.reviewCard}>
          <Text style={driverReviewStyles.reviewSectionTitle}>Informations</Text>
          <View style={driverReviewStyles.reviewTagsGrid}>
            <View style={driverReviewStyles.reviewTag}>
              <Text style={driverReviewStyles.reviewTagLabel}>Prénom</Text>
              <Text style={driverReviewStyles.reviewTagValue}>{driver.firstName}</Text>
            </View>
            <View style={driverReviewStyles.reviewTag}>
              <Text style={driverReviewStyles.reviewTagLabel}>Nom</Text>
              <Text style={driverReviewStyles.reviewTagValue}>{driver.lastName}</Text>
            </View>
            <View style={[driverReviewStyles.reviewTag, driverReviewStyles.reviewTagFull]}>
              <Text style={driverReviewStyles.reviewTagLabel}>Email</Text>
              <Text style={driverReviewStyles.reviewTagValue}>{driver.email}</Text>
            </View>
            <View style={driverReviewStyles.reviewTag}>
              <Text style={driverReviewStyles.reviewTagLabel}>Téléphone</Text>
              <Text style={driverReviewStyles.reviewTagValue}>{driver.phone}</Text>
            </View>
            <View style={driverReviewStyles.reviewTag}>
              <Text style={driverReviewStyles.reviewTagLabel}>Date de naissance</Text>
              <Text style={driverReviewStyles.reviewTagValue}>{driver.birthDate}</Text>
            </View>
          </View>
        </View>

        {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
        <Pressable onPress={onSubmit} disabled={isSubmitting} style={authSharedStyles.primaryButton}>
          <Text style={authSharedStyles.primaryButtonText}>
            {isSubmitting ? 'Chargement...' : 'Créer mon compte'}
          </Text>
        </Pressable>
      </WizardScreenLayout>
    </ScrollView>
  );
}

const driverReviewStyles = StyleSheet.create({
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.025,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  reviewSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3fa6',
  },
  reviewTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewTag: {
    width: '48%',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  reviewTagFull: {
    width: '100%',
  },
  reviewTagLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  reviewTagValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});
