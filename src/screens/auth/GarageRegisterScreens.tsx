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

const hhmmPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(value: string): number | null {
  if (!hhmmPattern.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function hasSlotsOverlap(slots: { open: string; close: string }[]): boolean {
  const ranges = slots
    .map((slot) => {
      const open = toMinutes(slot.open);
      const close = toMinutes(slot.close);
      if (open === null || close === null) {
        return null;
      }
      return { open, close };
    })
    .filter((item): item is { open: number; close: number } => item !== null)
    .sort((a, b) => a.open - b.open);

  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index - 1].close > ranges[index].open) {
      return true;
    }
  }

  return false;
}

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
        garage.services.length === 0 ||
        garage.services.some((service) => {
          const price = Number(service.price);
          return (
            !service.category.trim() ||
            !service.serviceName.trim() ||
            !Number.isFinite(price) ||
            price <= 0
          );
        })
          ? 'Renseigne au moins un service valide (catégorie, prestation, prix > 0).'
          : null,
      hoursError: dayKeys.some((day) => {
        const slots = garage.openingHours[day];
        const hasInvalidRange = slots.some((slot) => {
          const open = toMinutes(slot.open);
          const close = toMinutes(slot.close);
          return open === null || close === null || open >= close;
        });
        return hasInvalidRange || hasSlotsOverlap(slots);
      })
        ? 'Les horaires doivent être au format HH:MM, sans chevauchement, et avec ouverture avant fermeture.'
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

  const onUpdateService = (
    index: number,
    field: 'category' | 'serviceName' | 'price',
    value: string,
  ) => {
    const services = garage.services.map((service, currentIndex) =>
      currentIndex === index ? { ...service, [field]: value } : service,
    );
    setGarage({ services });
  };

  const onAddService = () => {
    setError(null);
    setGarage({
      services: [...garage.services, { category: '', serviceName: '', price: '' }],
    });
  };

  const onRemoveService = (index: number) => {
    const services = garage.services.filter((_, currentIndex) => currentIndex !== index);
    setGarage({
      services: services.length > 0 ? services : [{ category: '', serviceName: '', price: '' }],
    });
  };

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
      {garage.services.map((service, index) => (
        <View key={`${index}-${service.category}-${service.serviceName}`} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceTitle}>Service {index + 1}</Text>
            {garage.services.length > 1 ? (
              <Pressable onPress={() => onRemoveService(index)} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Supprimer</Text>
              </Pressable>
            ) : null}
          </View>
          <LabeledInput
            label="Catégorie"
            value={service.category}
            onChangeText={(value) => {
              setError(null);
              onUpdateService(index, 'category', value);
            }}
            placeholder="Ex: Vidange"
          />
          <LabeledInput
            label="Prestation"
            value={service.serviceName}
            onChangeText={(value) => {
              setError(null);
              onUpdateService(index, 'serviceName', value);
            }}
            placeholder="Ex: Forfait vidange"
          />
          <LabeledInput
            label="Prix"
            value={service.price}
            onChangeText={(value) => {
              setError(null);
              onUpdateService(index, 'price', value);
            }}
            keyboardType="decimal-pad"
            placeholder="49.90"
          />
        </View>
      ))}
      <Pressable onPress={onAddService} style={authSharedStyles.secondaryButton}>
        <Text style={authSharedStyles.secondaryButtonText}>Ajouter un service</Text>
      </Pressable>
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

  const onUpdateHour = (
    day: (typeof dayKeys)[number],
    slotIndex: number,
    field: 'open' | 'close',
    value: string,
  ) => {
    const currentDay = garage.openingHours[day];
    const nextDay = currentDay.map((slot, index) =>
      index === slotIndex ? { ...slot, [field]: value } : slot,
    );
    setGarage({
      openingHours: {
        ...garage.openingHours,
        [day]: nextDay,
      },
    });
  };

  const onAddHour = (day: (typeof dayKeys)[number]) => {
    const currentDay = garage.openingHours[day];
    setGarage({
      openingHours: {
        ...garage.openingHours,
        [day]: [...currentDay, { open: '08:00', close: '18:00' }],
      },
    });
  };

  const onRemoveHour = (day: (typeof dayKeys)[number], slotIndex: number) => {
    const currentDay = garage.openingHours[day];
    setGarage({
      openingHours: {
        ...garage.openingHours,
        [day]: currentDay.filter((_, index) => index !== slotIndex),
      },
    });
  };

  const onSetDayClosed = (day: (typeof dayKeys)[number]) => {
    setGarage({
      openingHours: {
        ...garage.openingHours,
        [day]: [],
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
          const slots = garage.openingHours[day];
          return (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{dayLabels[day]}</Text>
                {slots.length > 0 ? (
                  <Pressable onPress={() => onSetDayClosed(day)} style={styles.linkButton}>
                    <Text style={styles.linkButtonText}>Marquer fermé</Text>
                  </Pressable>
                ) : null}
              </View>
              {slots.length === 0 ? <Text style={styles.closedText}>Fermé</Text> : null}
              {slots.map((slot, slotIndex) => (
                <View key={`${day}-${slotIndex}`} style={styles.slotCard}>
                  <View style={styles.slotHeader}>
                    <Text style={styles.slotTitle}>Créneau {slotIndex + 1}</Text>
                    <Pressable onPress={() => onRemoveHour(day, slotIndex)} style={styles.linkButton}>
                      <Text style={styles.linkButtonText}>Supprimer</Text>
                    </Pressable>
                  </View>
                  <LabeledInput
                    label="Ouverture (HH:MM)"
                    value={slot.open}
                    onChangeText={(value) => onUpdateHour(day, slotIndex, 'open', value)}
                    placeholder="08:00"
                  />
                  <LabeledInput
                    label="Fermeture (HH:MM)"
                    value={slot.close}
                    onChangeText={(value) => onUpdateHour(day, slotIndex, 'close', value)}
                    placeholder="18:00"
                  />
                </View>
              ))}
              <Pressable onPress={() => onAddHour(day)} style={authSharedStyles.secondaryButton}>
                <Text style={authSharedStyles.secondaryButtonText}>Ajouter un créneau</Text>
              </Pressable>
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
  const servicesPayload = toGarageServicesPayload();

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
      services: servicesPayload,
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
      <Text style={styles.sectionTitle}>Services</Text>
      {servicesPayload.map((categoryBlock) =>
        Object.entries(categoryBlock).map(([category, services]) => (
          <View key={category} style={styles.reviewBlock}>
            <Text style={styles.reviewBlockTitle}>{category}</Text>
            {services.map((service, index) => (
              <Text key={`${category}-${service.serviceName}-${index}`}>
                - {service.serviceName} ({service.price} EUR)
              </Text>
            ))}
          </View>
        )),
      )}
      <Text style={styles.sectionTitle}>Horaires</Text>
      {dayKeys.map((day) => {
        const slots = garage.openingHours[day];
        const label =
          slots.length === 0
            ? 'Fermé'
            : slots.map((slot) => `${slot.open}-${slot.close}`).join(', ');
        return (
          <Text key={`review-${day}`}>
            {dayLabels[day]}: {label}
          </Text>
        );
      })}
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
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayTitle: {
    color: '#0f172a',
    fontWeight: '700',
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceTitle: {
    color: '#0f172a',
    fontWeight: '700',
  },
  linkButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  closedText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  slotCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    gap: 6,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotTitle: {
    color: '#334155',
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 8,
  },
  reviewBlock: {
    gap: 2,
  },
  reviewBlockTitle: {
    color: '#334155',
    fontWeight: '700',
  },
});
