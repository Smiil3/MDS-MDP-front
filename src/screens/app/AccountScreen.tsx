import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../context/auth/AuthContext';
import {
  createMyVehicle,
  getMyProfile,
  getMyVehicles,
  updateMyProfile,
} from '../../services/api/profileApi';
import { AccountStackParamList } from '../../types/navigation';
import { DriverProfile, DriverVehicle } from '../../types/profile';

type Props = NativeStackScreenProps<AccountStackParamList, 'AccountMain'>;

const PROFILE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=600&q=80';

export function AccountScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleEngine, setVehicleEngine] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleMileage, setVehicleMileage] = useState('');
  const [vehicleFuelType, setVehicleFuelType] = useState('');

  const profileImage = useMemo(
    () => profile?.image_url?.trim() || PROFILE_PLACEHOLDER,
    [profile?.image_url],
  );

  useEffect(() => {
    if (user?.role !== 'driver') {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const [nextProfile, nextVehicles] = await Promise.all([
          getMyProfile(),
          getMyVehicles(),
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);
        setVehicles(nextVehicles);
        setFirstName(nextProfile.first_name);
        setLastName(nextProfile.last_name);
        setPhone(nextProfile.phone);
        setEmail(nextProfile.email);
        setBirthDate(nextProfile.birth_date);
        setImageUrl(nextProfile.image_url ?? '');
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger le profil.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData().catch(() => {
      if (isMounted) {
        setErrorMessage('Impossible de charger le profil.');
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  const onSaveProfile = async () => {
    if (!profile) {
      return;
    }

    try {
      setIsSavingProfile(true);
      setErrorMessage(null);
      const updated = await updateMyProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        birth_date: birthDate.trim(),
        image_url: imageUrl.trim(),
      });
      setProfile(updated);
      setIsEditMode(false);
    } catch {
      setErrorMessage('Impossible de sauvegarder le profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onAddVehicle = async () => {
    const parsedYear = Number.parseInt(vehicleYear, 10);
    const parsedMileage = Number.parseInt(vehicleMileage, 10);
    if (
      !vehicleBrand.trim() ||
      !vehicleModel.trim() ||
      !vehicleEngine.trim() ||
      !vehiclePlate.trim() ||
      Number.isNaN(parsedYear) ||
      Number.isNaN(parsedMileage)
    ) {
      setErrorMessage('Merci de compléter tous les champs véhicule obligatoires.');
      return;
    }

    try {
      setIsSavingVehicle(true);
      setErrorMessage(null);
      const vehicle = await createMyVehicle({
        brand: vehicleBrand.trim(),
        model: vehicleModel.trim(),
        year: parsedYear,
        engine: vehicleEngine.trim(),
        license_plate: vehiclePlate.trim(),
        mileage: parsedMileage,
        fuel_type: vehicleFuelType.trim() || undefined,
      });
      setVehicles((current) => [vehicle, ...current]);
      setVehicleBrand('');
      setVehicleModel('');
      setVehicleYear('');
      setVehicleEngine('');
      setVehiclePlate('');
      setVehicleMileage('');
      setVehicleFuelType('');
    } catch {
      setErrorMessage("Impossible d'ajouter ce véhicule.");
    } finally {
      setIsSavingVehicle(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (user?.role !== 'driver') {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.profileText}>Le profil détaillé est disponible uniquement côté driver.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('MyBookings')}>
          <Text style={styles.primaryButtonText}>Mes réservations</Text>
        </Pressable>
        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mon profil</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.profileCard}>
        <Image source={{ uri: profileImage }} style={styles.avatar} />
        <Text style={styles.userLabel}>Compte connecté: {user?.role}</Text>

        {!isEditMode ? (
          <>
            <Text style={styles.profileText}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={styles.profileText}>{profile?.email}</Text>
            <Text style={styles.profileText}>{profile?.phone}</Text>
            <Text style={styles.profileText}>Naissance: {profile?.birth_date}</Text>
            <Pressable style={styles.primaryButton} onPress={() => setIsEditMode(true)}>
              <Text style={styles.primaryButtonText}>Modifier mon profil</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
            />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Téléphone"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="Date de naissance (YYYY-MM-DD)"
            />
            <TextInput
              style={styles.input}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="URL image profil"
              autoCapitalize="none"
            />
            <View style={styles.rowButtons}>
              <Pressable
                style={[styles.primaryButton, styles.inlineButton]}
                onPress={() => {
                  if (!profile) {
                    return;
                  }
                  setFirstName(profile.first_name);
                  setLastName(profile.last_name);
                  setEmail(profile.email);
                  setPhone(profile.phone);
                  setBirthDate(profile.birth_date);
                  setImageUrl(profile.image_url ?? '');
                  setIsEditMode(false);
                }}
              >
                <Text style={styles.primaryButtonText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.inlineButton]}
                onPress={() => {
                  void onSaveProfile();
                }}
                disabled={isSavingProfile}
              >
                <Text style={styles.primaryButtonText}>
                  {isSavingProfile ? 'Sauvegarde...' : 'Enregistrer'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('MyBookings')}>
        <Text style={styles.primaryButtonText}>Mes réservations</Text>
      </Pressable>

      <View style={styles.vehiclesSection}>
        <Text style={styles.sectionTitle}>Mes véhicules</Text>
        {vehicles.length === 0 ? (
          <Text style={styles.emptyText}>Aucun véhicule pour le moment.</Text>
        ) : (
          vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <Text style={styles.vehicleTitle}>
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </Text>
              <Text style={styles.vehicleInfo}>Moteur: {vehicle.engine}</Text>
              <Text style={styles.vehicleInfo}>Plaque: {vehicle.license_plate ?? 'N/A'}</Text>
              <Text style={styles.vehicleInfo}>Carburant: {vehicle.fuel_type ?? 'N/A'}</Text>
              <Text style={styles.vehicleInfo}>Kilométrage: {vehicle.mileage} km</Text>
            </View>
          ))
        )}

        <View style={styles.addVehicleCard}>
          <Text style={styles.addVehicleTitle}>Ajouter un véhicule</Text>
          <TextInput
            style={styles.input}
            value={vehicleBrand}
            onChangeText={setVehicleBrand}
            placeholder="Marque"
          />
          <TextInput
            style={styles.input}
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholder="Modèle"
          />
          <TextInput
            style={styles.input}
            value={vehicleYear}
            onChangeText={setVehicleYear}
            placeholder="Année"
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            value={vehicleEngine}
            onChangeText={setVehicleEngine}
            placeholder="Moteur"
          />
          <TextInput
            style={styles.input}
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            placeholder="Plaque d'immatriculation"
          />
          <TextInput
            style={styles.input}
            value={vehicleMileage}
            onChangeText={setVehicleMileage}
            placeholder="Kilométrage"
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            value={vehicleFuelType}
            onChangeText={setVehicleFuelType}
            placeholder="Carburant (optionnel)"
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              void onAddVehicle();
            }}
            disabled={isSavingVehicle}
          >
            <Text style={styles.primaryButtonText}>
              {isSavingVehicle ? 'Ajout...' : 'Ajouter le véhicule'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => { console.log('[DEBUG] navigate MyBookings'); navigation.navigate('MyBookings'); }}>
        <Text style={styles.primaryButtonText}>Mes réservations</Text>
      </Pressable>

      <Pressable onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
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
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
  },
  userLabel: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 13,
  },
  profileText: {
    fontSize: 15,
    color: '#334155',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  vehiclesSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    color: '#475569',
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 4,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#334155',
  },
  addVehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  addVehicleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  logoutButton: {
    marginTop: 8,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
