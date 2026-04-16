import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../../context/auth/AuthContext';
import {
  AuthRole,
  DriverRegisterPayload,
  MechanicServiceCategory,
  MechanicOpeningHourSlot,
  MechanicOpeningHours,
  MechanicRegisterPayload,
} from '../../types/auth';
import { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type MechanicStep = 'garage' | 'hours' | 'services' | 'credentials';
type DayKey = keyof MechanicOpeningHours;
type DraftMechanicService = {
  serviceName: string;
  price: string;
};
type DraftMechanicServiceCategory = {
  categoryName: string;
  services: DraftMechanicService[];
};

const roleLabels: Record<AuthRole, string> = {
  driver: 'Driver',
  mechanic: 'Mechanic',
};

const dayLabels: Record<DayKey, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

const dayKeys: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const createTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return options;
};

const timeOptions = createTimeOptions();
const defaultSlot: MechanicOpeningHourSlot = { open: '08:00', close: '18:00' };

const createInitialOpeningHours = (): MechanicOpeningHours => ({
  mon: [{ ...defaultSlot }],
  tue: [{ ...defaultSlot }],
  wed: [{ ...defaultSlot }],
  thu: [{ ...defaultSlot }],
  fri: [{ ...defaultSlot }],
  sat: [],
  sun: [],
});

const getTimeIndex = (value: string) => {
  const index = timeOptions.indexOf(value);
  return index >= 0 ? index : 0;
};

const getShiftedTime = (value: string, direction: 'prev' | 'next') => {
  const current = getTimeIndex(value);
  const max = timeOptions.length - 1;
  const nextIndex = direction === 'next' ? Math.min(current + 1, max) : Math.max(current - 1, 0);
  return timeOptions[nextIndex];
};

const hasAtLeastOneOpeningSlot = (openingHours: MechanicOpeningHours) =>
  dayKeys.some((day) => openingHours[day].length > 0);

const hasInvalidSlot = (openingHours: MechanicOpeningHours) =>
  dayKeys.some((day) =>
    openingHours[day].some((slot) => getTimeIndex(slot.open) >= getTimeIndex(slot.close)),
  );

const createInitialDraftServices = (): DraftMechanicServiceCategory[] => [
  {
    categoryName: '',
    services: [{ serviceName: '', price: '' }],
  },
];

const hasAtLeastOneCompleteService = (categories: DraftMechanicServiceCategory[]) =>
  categories.some((category) =>
    category.services.some(
      (service) =>
        category.categoryName.trim() &&
        service.serviceName.trim() &&
        Number.isFinite(Number(service.price)) &&
        Number(service.price) > 0,
    ),
  );

const hasInvalidServiceEntries = (categories: DraftMechanicServiceCategory[]) =>
  categories.some((category) => {
    const categoryName = category.categoryName.trim();
    if (!categoryName) {
      return true;
    }

    if (category.services.length === 0) {
      return true;
    }

    return category.services.some((service) => {
      if (!service.serviceName.trim()) {
        return true;
      }
      const parsedPrice = Number(service.price);
      if (!Number.isFinite(parsedPrice)) {
        return true;
      }
      return parsedPrice <= 0;
    });
  });

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [role, setRole] = useState<AuthRole>('driver');
  const [mechanicStep, setMechanicStep] = useState<MechanicStep>('garage');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');

  const [mechanicName, setMechanicName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [siret, setSiret] = useState('');
  const [openingHours, setOpeningHours] = useState<MechanicOpeningHours>(createInitialOpeningHours);
  const [services, setServices] = useState<DraftMechanicServiceCategory[]>(createInitialDraftServices);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMechanicSlot = (
    day: DayKey,
    index: number,
    field: keyof MechanicOpeningHourSlot,
    value: string,
  ) => {
    setOpeningHours((previous) => {
      const next = {
        ...previous,
        [day]: previous[day].map((slot, slotIndex) =>
          slotIndex === index ? { ...slot, [field]: value } : slot,
        ),
      };
      return next;
    });
  };

  const addMechanicSlot = (day: DayKey) => {
    setOpeningHours((previous) => ({
      ...previous,
      [day]: [...previous[day], { ...defaultSlot }],
    }));
  };

  const removeMechanicSlot = (day: DayKey, index: number) => {
    setOpeningHours((previous) => ({
      ...previous,
      [day]: previous[day].filter((_, slotIndex) => slotIndex !== index),
    }));
  };

  const updateServiceCategoryName = (index: number, value: string) => {
    setServices((previous) =>
      previous.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, categoryName: value } : category,
      ),
    );
  };

  const addServiceCategory = () => {
    setServices((previous) => [
      ...previous,
      { categoryName: '', services: [{ serviceName: '', price: '' }] },
    ]);
  };

  const removeServiceCategory = (index: number) => {
    setServices((previous) => previous.filter((_, categoryIndex) => categoryIndex !== index));
  };

  const addServiceToCategory = (categoryIndex: number) => {
    setServices((previous) =>
      previous.map((category, currentIndex) =>
        currentIndex === categoryIndex
          ? {
              ...category,
              services: [...category.services, { serviceName: '', price: '' }],
            }
          : category,
      ),
    );
  };

  const removeServiceFromCategory = (categoryIndex: number, serviceIndex: number) => {
    setServices((previous) =>
      previous.map((category, currentIndex) =>
        currentIndex === categoryIndex
          ? {
              ...category,
              services: category.services.filter((_, itemIndex) => itemIndex !== serviceIndex),
            }
          : category,
      ),
    );
  };

  const updateServiceInCategory = (
    categoryIndex: number,
    serviceIndex: number,
    field: keyof DraftMechanicService,
    value: string,
  ) => {
    setServices((previous) =>
      previous.map((category, currentCategoryIndex) =>
        currentCategoryIndex === categoryIndex
          ? {
              ...category,
              services: category.services.map((service, currentServiceIndex) =>
                currentServiceIndex === serviceIndex ? { ...service, [field]: value } : service,
              ),
            }
          : category,
      ),
    );
  };

  const onSelectRole = (nextRole: AuthRole) => {
    setRole(nextRole);
    if (nextRole === 'mechanic') {
      setMechanicStep('garage');
    }
    setError(null);
  };

  const garageInfoValidationError = useMemo(() => {
    if (role !== 'mechanic') {
      return null;
    }

    if (
      !mechanicName.trim() ||
      !address.trim() ||
      !zipCode.trim() ||
      !city.trim() ||
      !siret.trim()
    ) {
      return 'Merci de compléter toutes les informations du garage.';
    }

    if (!/^\d+$/.test(zipCode)) {
      return 'Le code postal doit être numérique.';
    }

    if (!/^\d{14}$/.test(siret.trim())) {
      return 'Le SIRET doit contenir exactement 14 chiffres.';
    }

    if (imageUrl.trim()) {
      try {
        new URL(imageUrl.trim());
      } catch {
        return "L'URL de l'image n'est pas valide.";
      }
    }
    return null;
  }, [role, mechanicName, address, zipCode, city, siret, imageUrl]);

  const hoursValidationError = useMemo(() => {
    if (role !== 'mechanic') {
      return null;
    }

    if (!hasAtLeastOneOpeningSlot(openingHours)) {
      return "Ajoute au moins un créneau d'ouverture.";
    }

    if (hasInvalidSlot(openingHours)) {
      return "Chaque créneau doit avoir une heure d'ouverture antérieure à l'heure de fermeture.";
    }

    return null;
  }, [role, openingHours]);

  const servicesValidationError = useMemo(() => {
    if (role !== 'mechanic') {
      return null;
    }

    if (!hasAtLeastOneCompleteService(services)) {
      return 'Ajoute au moins une prestation valide.';
    }

    if (hasInvalidServiceEntries(services)) {
      return 'Chaque catégorie doit avoir un nom, et chaque prestation doit avoir un nom et un prix supérieur à 0.';
    }

    return null;
  }, [role, services]);

  const credentialsValidationError = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return 'Email et mot de passe sont requis.';
    }

    if (!email.includes('@')) {
      return 'Merci de saisir un email valide.';
    }

    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }

    if (role === 'mechanic' && password !== passwordConfirmation) {
      return 'Les mots de passe ne correspondent pas.';
    }

    if (role === 'driver') {
      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !phone.trim() ||
        !birthDate.trim() ||
        !subscriptionId.trim()
      ) {
        return 'Merci de compléter tous les champs driver.';
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
        return 'La date de naissance doit être au format YYYY-MM-DD.';
      }

      if (!Number.isInteger(Number(subscriptionId)) || Number(subscriptionId) <= 0) {
        return "L'identifiant d'abonnement doit être un entier positif.";
      }
    }

    return null;
  }, [
    role,
    email,
    password,
    passwordConfirmation,
    firstName,
    lastName,
    phone,
    birthDate,
    subscriptionId,
  ]);

  const toMechanicServicesPayload = (): MechanicServiceCategory[] =>
    services
      .map((category) => {
        const categoryName = category.categoryName.trim();
        if (!categoryName) {
          return null;
        }

        const entries = category.services
          .map((service) => {
            const serviceName = service.serviceName.trim();
            const price = Number(service.price);
            if (!serviceName || !Number.isFinite(price) || price <= 0) {
              return null;
            }
            return {
              serviceName,
              price,
            };
          })
          .filter((entry): entry is { serviceName: string; price: number } => entry !== null);

        if (entries.length === 0) {
          return null;
        }

        return { [categoryName]: entries };
      })
      .filter((category): category is MechanicServiceCategory => category !== null);

  const validateMechanicStep = (step: MechanicStep): string | null => {
    if (step === 'garage') {
      return garageInfoValidationError;
    }
    if (step === 'hours') {
      return hoursValidationError;
    }
    if (step === 'services') {
      return servicesValidationError;
    }
    return credentialsValidationError;
  };

  const nextMechanicStep = (step: MechanicStep): MechanicStep | null => {
    if (step === 'garage') {
      return 'hours';
    }
    if (step === 'hours') {
      return 'services';
    }
    if (step === 'services') {
      return 'credentials';
    }
    return null;
  };

  const onSelectMechanicStep = (targetStep: MechanicStep) => {
    setError(null);
    const stepsOrder: MechanicStep[] = ['garage', 'hours', 'services', 'credentials'];
    const targetIndex = stepsOrder.indexOf(targetStep);
    const currentIndex = stepsOrder.indexOf(mechanicStep);

    if (targetIndex <= currentIndex) {
      setMechanicStep(targetStep);
      return;
    }

    for (let index = 0; index < targetIndex; index += 1) {
      const step = stepsOrder[index];
      const validationError = validateMechanicStep(step);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setMechanicStep(targetStep);
  };

  const onSubmit = async () => {
    setError(null);

    if (role === 'mechanic') {
      const currentStepError = validateMechanicStep(mechanicStep);
      if (currentStepError) {
        setError(currentStepError);
        return;
      }

      const nextStep = nextMechanicStep(mechanicStep);
      if (nextStep) {
        setMechanicStep(nextStep);
        return;
      }
    }

    if (credentialsValidationError) {
      setError(credentialsValidationError);
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
          image_url: imageUrl.trim() || undefined,
          opening_hours: openingHours,
          services: toMechanicServicesPayload(),
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
            onPress={() => onSelectRole(value)}
            style={[styles.roleButton, role === value && styles.roleButtonActive]}
          >
            <Text style={[styles.roleText, role === value && styles.roleTextActive]}>
              {roleLabels[value]}
            </Text>
          </Pressable>
        ))}
      </View>

      {role === 'driver' ? (
        <>
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
          <View style={styles.stepHeader}>
            <Pressable
              onPress={() => onSelectMechanicStep('garage')}
              style={[styles.stepButton, mechanicStep === 'garage' && styles.stepButtonActive]}
            >
              <Text style={[styles.stepButtonText, mechanicStep === 'garage' && styles.stepButtonTextActive]}>
                1. Garage
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSelectMechanicStep('hours')}
              style={[styles.stepButton, mechanicStep === 'hours' && styles.stepButtonActive]}
            >
              <Text style={[styles.stepButtonText, mechanicStep === 'hours' && styles.stepButtonTextActive]}>
                2. Horaires
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSelectMechanicStep('services')}
              style={[styles.stepButton, mechanicStep === 'services' && styles.stepButtonActive]}
            >
              <Text style={[styles.stepButtonText, mechanicStep === 'services' && styles.stepButtonTextActive]}>
                3. Prestations
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSelectMechanicStep('credentials')}
              style={[styles.stepButton, mechanicStep === 'credentials' && styles.stepButtonActive]}
            >
              <Text style={[styles.stepButtonText, mechanicStep === 'credentials' && styles.stepButtonTextActive]}>
                4. Identifiants
              </Text>
            </Pressable>
          </View>

          {mechanicStep === 'garage' ? (
            <>
              <TextInput
                value={mechanicName}
                onChangeText={setMechanicName}
                placeholder="Nom du garage"
                style={styles.input}
              />
              <TextInput
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="URL image (optionnel)"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                multiline
                style={[styles.input, styles.multilineInput]}
              />
              <TextInput value={siret} onChangeText={setSiret} placeholder="SIRET" style={styles.input} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Adresse"
                style={styles.input}
              />
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Code postal"
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput value={city} onChangeText={setCity} placeholder="Ville" style={styles.input} />
            </>
          ) : null}

          {mechanicStep === 'hours' ? (
            <View style={styles.hoursContainer}>
              <Text style={styles.hoursTitle}>Heures d&apos;ouverture</Text>
              {dayKeys.map((day) => (
                <View key={day} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{dayLabels[day]}</Text>
                    <Pressable onPress={() => addMechanicSlot(day)} style={styles.smallActionButton}>
                      <Text style={styles.smallActionText}>+ Créneau</Text>
                    </Pressable>
                  </View>

                  {openingHours[day].length === 0 ? (
                    <Text style={styles.closedLabel}>Fermé</Text>
                  ) : (
                    openingHours[day].map((slot, slotIndex) => (
                      <View key={`${day}-${slotIndex}`} style={styles.slotRow}>
                        <View style={styles.timeSelectGroup}>
                          <Text style={styles.timeLabel}>Ouverture</Text>
                          <View style={styles.timeSelector}>
                            <Pressable
                              onPress={() =>
                                updateMechanicSlot(day, slotIndex, 'open', getShiftedTime(slot.open, 'prev'))
                              }
                              style={styles.timeShiftButton}
                            >
                              <Text style={styles.timeShiftText}>-</Text>
                            </Pressable>
                            <Text style={styles.timeValue}>{slot.open}</Text>
                            <Pressable
                              onPress={() =>
                                updateMechanicSlot(day, slotIndex, 'open', getShiftedTime(slot.open, 'next'))
                              }
                              style={styles.timeShiftButton}
                            >
                              <Text style={styles.timeShiftText}>+</Text>
                            </Pressable>
                          </View>
                        </View>

                        <View style={styles.timeSelectGroup}>
                          <Text style={styles.timeLabel}>Fermeture</Text>
                          <View style={styles.timeSelector}>
                            <Pressable
                              onPress={() =>
                                updateMechanicSlot(day, slotIndex, 'close', getShiftedTime(slot.close, 'prev'))
                              }
                              style={styles.timeShiftButton}
                            >
                              <Text style={styles.timeShiftText}>-</Text>
                            </Pressable>
                            <Text style={styles.timeValue}>{slot.close}</Text>
                            <Pressable
                              onPress={() =>
                                updateMechanicSlot(day, slotIndex, 'close', getShiftedTime(slot.close, 'next'))
                              }
                              style={styles.timeShiftButton}
                            >
                              <Text style={styles.timeShiftText}>+</Text>
                            </Pressable>
                          </View>
                        </View>

                        <Pressable onPress={() => removeMechanicSlot(day, slotIndex)} style={styles.removeSlotButton}>
                          <Text style={styles.removeSlotText}>Supprimer</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {mechanicStep === 'services' ? (
            <View style={styles.servicesContainer}>
              <View style={styles.servicesHeader}>
                <Text style={styles.hoursTitle}>Prestations</Text>
                <Pressable onPress={addServiceCategory} style={styles.smallActionButton}>
                  <Text style={styles.smallActionText}>+ Catégorie</Text>
                </Pressable>
              </View>

              {services.map((category, categoryIndex) => (
                <View key={`category-${categoryIndex}`} style={styles.dayCard}>
                  <TextInput
                    value={category.categoryName}
                    onChangeText={(value) => updateServiceCategoryName(categoryIndex, value)}
                    placeholder="Nom de la catégorie (ex: vidange)"
                    style={styles.input}
                  />

                  {category.services.map((service, serviceIndex) => (
                    <View key={`service-${categoryIndex}-${serviceIndex}`} style={styles.serviceInputRow}>
                      <TextInput
                        value={service.serviceName}
                        onChangeText={(value) =>
                          updateServiceInCategory(categoryIndex, serviceIndex, 'serviceName', value)
                        }
                        placeholder="Nom prestation"
                        style={[styles.input, styles.serviceNameInput]}
                      />
                      <TextInput
                        value={service.price}
                        onChangeText={(value) => updateServiceInCategory(categoryIndex, serviceIndex, 'price', value)}
                        placeholder="Prix"
                        keyboardType="decimal-pad"
                        style={[styles.input, styles.servicePriceInput]}
                      />
                      <Pressable
                        onPress={() => removeServiceFromCategory(categoryIndex, serviceIndex)}
                        style={styles.removeServiceButton}
                      >
                        <Text style={styles.removeSlotText}>-</Text>
                      </Pressable>
                    </View>
                  ))}

                  <View style={styles.serviceActionsRow}>
                    <Pressable onPress={() => addServiceToCategory(categoryIndex)} style={styles.smallActionButton}>
                      <Text style={styles.smallActionText}>+ Prestation</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => removeServiceCategory(categoryIndex)}
                      style={styles.removeCategoryButton}
                    >
                      <Text style={styles.removeSlotText}>Supprimer catégorie</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {mechanicStep === 'credentials' ? (
            <>
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
                placeholder="Mot de passe"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                placeholder="Confirmer le mot de passe"
                secureTextEntry
                style={styles.input}
              />
            </>
          ) : null}
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable onPress={onSubmit} disabled={isSubmitting} style={styles.submitButton}>
        <Text style={styles.submitText}>
          {role === 'mechanic' && mechanicStep !== 'credentials'
            ? 'Continuer'
            : isSubmitting
              ? 'Creating...'
              : 'Create account'}
        </Text>
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
  stepHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  stepButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  stepButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  stepButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  stepButtonTextActive: {
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
  hoursContainer: {
    gap: 8,
  },
  servicesContainer: {
    gap: 8,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  dayCard: {
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontWeight: '700',
    color: '#1e293b',
  },
  smallActionButton: {
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
  },
  smallActionText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 12,
  },
  closedLabel: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  slotRow: {
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  timeSelectGroup: {
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  timeShiftButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  timeShiftText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  timeValue: {
    minWidth: 54,
    textAlign: 'center',
    fontWeight: '700',
    color: '#0f172a',
  },
  removeSlotButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  serviceInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  serviceNameInput: {
    flex: 1,
  },
  servicePriceInput: {
    width: 90,
  },
  removeServiceButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  serviceActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeCategoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeSlotText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 12,
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
