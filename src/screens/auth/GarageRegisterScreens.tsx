import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../context/auth/AuthContext';
import { useAuthOnboarding } from '../../context/auth/AuthOnboardingContext';
import {
  getAddressSuggestions,
  getCitiesByPostalCode,
  lookupGarageBySiret,
} from '../../services/api/locationApi';
import { MechanicRegisterPayload } from '../../types/auth';
import { AuthStackParamList } from '../../types/navigation';
import { AddressSuggestion } from '../../types/location';
import { authSharedStyles, LabeledInput, WizardScreenLayout } from './onboarding/common';

const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const dayLabels: Record<(typeof dayKeys)[number], string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

function useGarageValidation() {
  const { garage } = useAuthOnboarding();
  return useMemo(
    () => ({
      infoError:
        !/^\d{14}$/.test(garage.siret)
          ? 'Le SIRET doit contenir 14 chiffres.'
          : !garage.name.trim()
            ? 'Le nom du garage est requis.'
            : null,
      addressError:
        !garage.address.trim() || !/^\d{5}$/.test(garage.zipCode) || !garage.city.trim()
          ? 'Adresse, code postal (5 chiffres) et ville sont requis.'
          : null,
      servicesError:
        !garage.serviceCategory.trim() ||
        !garage.serviceName.trim() ||
        !Number.isFinite(Number(garage.servicePrice)) ||
        Number(garage.servicePrice) <= 0
          ? 'Renseigne une catégorie, une prestation et un prix valide.'
          : null,
      hoursError: dayKeys.some((day) =>
        garage.openingHours[day].some((slot) => slot.open >= slot.close),
      )
        ? 'Les horaires doivent avoir une ouverture avant la fermeture.'
        : null,
      credentialsError:
        !garage.email.trim()
          ? 'Email requis.'
          : !garage.email.includes('@')
            ? 'Email invalide.'
            : !garage.password.trim()
              ? 'Mot de passe requis.'
              : garage.password.length < 6
                ? 'Minimum 6 caractères.'
                : garage.password !== garage.passwordConfirmation
                  ? 'Les mots de passe ne correspondent pas.'
                  : null,
    }),
    [garage],
  );
}

type InfoProps = NativeStackScreenProps<AuthStackParamList, 'RegisterGarageInfo'>;

export function RegisterGarageInfoScreen({ navigation }: InfoProps) {
  const { garage, setGarage } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSiret, setIsCheckingSiret] = useState(false);
  const [siretSource, setSiretSource] = useState<string | null>(null);
  const { infoError } = useGarageValidation();

  const onLookupSiret = async () => {
    if (!/^\d{14}$/.test(garage.siret)) {
      setError('Saisis un SIRET à 14 chiffres avant la vérification.');
      return;
    }
    try {
      setIsCheckingSiret(true);
      const response = await lookupGarageBySiret(garage.siret);
      setGarage({
        name: response.garage.name || garage.name,
        address: response.garage.address || garage.address,
        zipCode: response.garage.zipCode || garage.zipCode,
        city: response.garage.city || garage.city,
      });
      setSiretSource(response.source.toUpperCase());
      setError(null);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Lookup SIRET impossible.');
    } finally {
      setIsCheckingSiret(false);
    }
  };

  const onNext = () => {
    if (infoError) {
      setError(infoError);
      return;
    }
    navigation.navigate('RegisterGarageAddress');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 24 }}>
      <WizardScreenLayout
        title="Infos garage"
        subtitle="Étape 1/6"
        stepLabel="Garage"
        canGoBack
        onGoBack={() => navigation.goBack()}
      >
        <LabeledInput
          label="SIRET"
          value={garage.siret}
          onChangeText={(value) => {
            setError(null);
            setSiretSource(null);
            setGarage({ siret: value.replace(/\D/g, '').slice(0, 14) });
          }}
          keyboardType="number-pad"
          placeholder="14 chiffres"
        />
        <Pressable
          onPress={onLookupSiret}
          disabled={isCheckingSiret}
          style={authSharedStyles.secondaryButton}
        >
          <Text style={authSharedStyles.secondaryButtonText}>
            {isCheckingSiret ? 'Vérification...' : 'Vérifier le SIRET'}
          </Text>
        </Pressable>
        {siretSource ? <Text>Infos récupérées via {siretSource}</Text> : null}
        <LabeledInput
          label="Nom du garage"
          value={garage.name}
          onChangeText={(value) => {
            setError(null);
            setGarage({ name: value });
          }}
        />
        <LabeledInput
          label="Image (URL optionnelle)"
          value={garage.imageUrl}
          onChangeText={(value) => setGarage({ imageUrl: value })}
          autoCapitalize="none"
        />
        <LabeledInput
          label="Description (optionnelle)"
          value={garage.description}
          onChangeText={(value) => setGarage({ description: value })}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
        <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
          <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
        </Pressable>
      </WizardScreenLayout>
    </ScrollView>
  );
}

type AddressProps = NativeStackScreenProps<AuthStackParamList, 'RegisterGarageAddress'>;

export function RegisterGarageAddressScreen({ navigation }: AddressProps) {
  const { garage, setGarage } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const { addressError } = useGarageValidation();

  useEffect(() => {
    if (garage.address.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await getAddressSuggestions(garage.address.trim());
        setSuggestions(response.suggestions);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [garage.address]);

  useEffect(() => {
    if (!/^\d{5}$/.test(garage.zipCode)) {
      setCities([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await getCitiesByPostalCode(garage.zipCode);
        setCities(response.cities);
      } catch {
        setCities([]);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [garage.zipCode]);

  const onNext = () => {
    if (addressError) {
      setError(addressError);
      return;
    }
    navigation.navigate('RegisterGarageServices');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 24 }}>
      <WizardScreenLayout
        title="Adresse garage"
        subtitle="Étape 2/6"
        stepLabel="Garage"
        canGoBack
        onGoBack={() => navigation.goBack()}
      >
        <LabeledInput
          label="Adresse"
          value={garage.address}
          onChangeText={(value) => {
            setError(null);
            setGarage({ address: value });
          }}
        />
        {suggestions.length > 0 ? (
          <View style={styles.listCard}>
            {suggestions.map((item) => (
              <Pressable
                key={item.label}
                style={styles.listItem}
                onPress={() => {
                  setGarage({
                    address: item.address,
                    zipCode: item.zipCode,
                    city: item.city,
                  });
                  setSuggestions([]);
                }}
              >
                <Text>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <LabeledInput
          label="Code postal"
          value={garage.zipCode}
          onChangeText={(value) => setGarage({ zipCode: value.replace(/\D/g, '').slice(0, 5) })}
          keyboardType="number-pad"
        />
        <Text style={{ color: '#334155', fontWeight: '600' }}>Ville</Text>
        {cities.length > 0 ? (
          <View style={styles.listCard}>
            {cities.map((city) => (
              <Pressable key={city} style={styles.listItem} onPress={() => setGarage({ city })}>
                <Text>{city}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <LabeledInput
          label="Ville sélectionnée"
          value={garage.city}
          onChangeText={(value) => setGarage({ city: value })}
        />
        {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
        <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
          <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
        </Pressable>
      </WizardScreenLayout>
    </ScrollView>
  );
}

type ServicesProps = NativeStackScreenProps<AuthStackParamList, 'RegisterGarageServices'>;

export function RegisterGarageServicesScreen({ navigation }: ServicesProps) {
  const { garage, setGarage } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const { servicesError } = useGarageValidation();

  const onNext = () => {
    if (servicesError) {
      setError(servicesError);
      return;
    }
    navigation.navigate('RegisterGarageHours');
  };

  return (
    <WizardScreenLayout
      title="Services"
      subtitle="Étape 3/6"
      stepLabel="Garage"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <LabeledInput
        label="Catégorie"
        value={garage.serviceCategory}
        onChangeText={(value) => {
          setError(null);
          setGarage({ serviceCategory: value });
        }}
        placeholder="Ex: Vidange"
      />
      <LabeledInput
        label="Prestation"
        value={garage.serviceName}
        onChangeText={(value) => {
          setError(null);
          setGarage({ serviceName: value });
        }}
        placeholder="Ex: Forfait vidange"
      />
      <LabeledInput
        label="Prix"
        value={garage.servicePrice}
        onChangeText={(value) => {
          setError(null);
          setGarage({ servicePrice: value });
        }}
        keyboardType="decimal-pad"
        placeholder="49.90"
      />
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

type HoursProps = NativeStackScreenProps<AuthStackParamList, 'RegisterGarageHours'>;

export function RegisterGarageHoursScreen({ navigation }: HoursProps) {
  const { garage, setGarage } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const { hoursError } = useGarageValidation();

  const onUpdateHour = (day: (typeof dayKeys)[number], field: 'open' | 'close', value: string) => {
    const currentDay = garage.openingHours[day];
    const slot = currentDay[0] ?? { open: '08:00', close: '18:00' };
    setGarage({
      openingHours: {
        ...garage.openingHours,
        [day]: [{ ...slot, [field]: value }],
      },
    });
  };

  const onNext = () => {
    if (hoursError) {
      setError(hoursError);
      return;
    }
    navigation.navigate('RegisterGarageCredentials');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 24 }}>
      <WizardScreenLayout
        title="Horaires"
        subtitle="Étape 4/6"
        stepLabel="Garage"
        canGoBack
        onGoBack={() => navigation.goBack()}
      >
        {dayKeys.map((day) => {
          const slot = garage.openingHours[day][0] ?? { open: '', close: '' };
          return (
            <View key={day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{dayLabels[day]}</Text>
              <LabeledInput
                label="Ouverture (HH:MM)"
                value={slot.open}
                onChangeText={(value) => onUpdateHour(day, 'open', value)}
                placeholder="08:00"
              />
              <LabeledInput
                label="Fermeture (HH:MM)"
                value={slot.close}
                onChangeText={(value) => onUpdateHour(day, 'close', value)}
                placeholder="18:00"
              />
            </View>
          );
        })}
        {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
        <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
          <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
        </Pressable>
      </WizardScreenLayout>
    </ScrollView>
  );
}

type CredentialsProps = NativeStackScreenProps<AuthStackParamList, 'RegisterGarageCredentials'>;

export function RegisterGarageCredentialsScreen({ navigation }: CredentialsProps) {
  const { garage, setGarage } = useAuthOnboarding();
  const [error, setError] = useState<string | null>(null);
  const { credentialsError } = useGarageValidation();

  const onNext = () => {
    if (credentialsError) {
      setError(credentialsError);
      return;
    }
    navigation.navigate('RegisterGarageReview');
  };

  return (
    <WizardScreenLayout
      title="Identifiants"
      subtitle="Étape 5/6"
      stepLabel="Garage"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <LabeledInput
        label="Email"
        value={garage.email}
        onChangeText={(value) => {
          setError(null);
          setGarage({ email: value });
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <LabeledInput
        label="Mot de passe"
        value={garage.password}
        onChangeText={(value) => {
          setError(null);
          setGarage({ password: value });
        }}
        secureTextEntry
      />
      <LabeledInput
        label="Confirmation"
        value={garage.passwordConfirmation}
        onChangeText={(value) => {
          setError(null);
          setGarage({ passwordConfirmation: value });
        }}
        secureTextEntry
      />
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onNext} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>Continuer</Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

type ReviewProps = NativeStackScreenProps<AuthStackParamList, 'RegisterGarageReview'>;

export function RegisterGarageReviewScreen({ navigation }: ReviewProps) {
  const { garage, toGarageServicesPayload, resetGarage, setSelectedAccountType } = useAuthOnboarding();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validation = useGarageValidation();

  const onSubmit = async () => {
    const firstError =
      validation.infoError ||
      validation.addressError ||
      validation.servicesError ||
      validation.hoursError ||
      validation.credentialsError;

    if (firstError) {
      setError(firstError);
      return;
    }

    const payload: MechanicRegisterPayload = {
      role: 'mechanic',
      email: garage.email.trim(),
      password: garage.password,
      name: garage.name.trim(),
      address: garage.address.trim(),
      zip_code: Number(garage.zipCode),
      city: garage.city.trim(),
      description: garage.description.trim() || undefined,
      image_url: garage.imageUrl.trim() || undefined,
      opening_hours: garage.openingHours,
      services: toGarageServicesPayload(),
      siret: garage.siret,
    };

    try {
      setIsSubmitting(true);
      await register(payload);
      resetGarage();
      setSelectedAccountType(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Inscription impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WizardScreenLayout
      title="Vérification"
      subtitle="Étape 6/6"
      stepLabel="Garage"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <Text>Garage: {garage.name}</Text>
      <Text>Adresse: {garage.address}</Text>
      <Text>
        Ville: {garage.zipCode} {garage.city}
      </Text>
      <Text>Service: {garage.serviceCategory} - {garage.serviceName} ({garage.servicePrice} EUR)</Text>
      <Text>Email: {garage.email}</Text>
      {error ? <Text style={authSharedStyles.errorText}>{error}</Text> : null}
      <Pressable onPress={onSubmit} disabled={isSubmitting} style={authSharedStyles.primaryButton}>
        <Text style={authSharedStyles.primaryButtonText}>
          {isSubmitting ? 'Création...' : 'Créer mon compte garage'}
        </Text>
      </Pressable>
    </WizardScreenLayout>
  );
}

const styles = StyleSheet.create({
  listCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  listItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dayCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
  },
  dayTitle: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
