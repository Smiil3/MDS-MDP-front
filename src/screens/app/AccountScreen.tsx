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

const CHEVRON_ICON = require('../../../assets/images/chevron.png');

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
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

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
      setIsAddVehicleOpen(false);
    } catch {
      setErrorMessage("Impossible d'ajouter ce véhicule.");
    } finally {
      setIsSavingVehicle(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1a3fa6" />
      </View>
    );
  }

  if (user?.role !== 'driver') {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.infoText}>
          Le profil détaillé est disponible uniquement côté driver.
        </Text>
        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── EN-TÊTE ── */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/logo-mecanoo.png')}
          style={styles.headerLogo}
        />

        <View style={styles.headerProfile}>
          <Image source={{ uri: profileImage }} style={styles.avatar} />
          <View style={styles.headerProfileInfo}>
            <Text style={styles.headerName}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{user?.role}</Text>
            </View>
            <View style={styles.headerInfoRow}>
              <Image source={require('../../../assets/images/mail.png')} style={styles.headerInfoIcon} />
              <Text style={styles.headerSub}>{profile?.email}</Text>
            </View>
            <View style={styles.headerInfoRow}>
              <Image source={require('../../../assets/images/phone.png')} style={styles.headerInfoIcon} />
              <Text style={styles.headerSub}>{profile?.phone}</Text>
            </View>
            <View style={styles.headerInfoRow}>
              <Image source={require('../../../assets/images/birth.png')} style={styles.headerInfoIcon} />
              <Text style={styles.headerSub}>
                {profile?.birth_date
                  ? new Date(profile.birth_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </Text>
            </View>
          </View>
        </View>

        {!isEditMode && (
          <Pressable style={styles.editButton} onPress={() => setIsEditMode(true)}>
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </Pressable>
        )}
      </View>

      {/* ── MESSAGE D'ERREUR ── */}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {/* ── FORMULAIRE D'ÉDITION ── */}
      {isEditMode && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modifier mes informations</Text>

          {/* Prénom / Nom */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Prénom"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Nom"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Email / Téléphone */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Téléphone"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Date de naissance / URL photo */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date de naissance</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>URL photo</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://..."
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.rowButtons}>
            <Pressable
              style={[styles.btnSecondary, styles.flex1]}
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
              <Text style={styles.btnSecondaryText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, styles.flex1]}
              onPress={() => {
                void onSaveProfile();
              }}
              disabled={isSavingProfile}
            >
              <Text style={styles.btnPrimaryText}>
                {isSavingProfile ? 'Sauvegarde...' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── MES VÉHICULES ── */}
      <Text style={styles.sectionTitle}>Mes véhicules</Text>

      {vehicles.length === 0 ? (
        <Text style={styles.emptyText}>Aucun véhicule pour le moment.</Text>
      ) : (
        vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.card}>
            <View style={styles.vehicleNameRow}>
              <Image
                source={require('../../../assets/images/car.png')}
                style={styles.vehicleNameIcon}
              />
              <Text style={styles.vehicleName}>
                {vehicle.brand} {vehicle.model}
                {vehicle.license_plate ? ` - ${vehicle.license_plate.toUpperCase()}` : ''}
              </Text>
            </View>

            <View style={styles.vehicleTags}>
              <View style={styles.vehicleTag}>
                <Text style={styles.vehicleTagLabel}>Année</Text>
                <Text style={styles.vehicleTagText}>{vehicle.year ?? 'Non renseigné'}</Text>
              </View>
              <View style={styles.vehicleTag}>
                <Text style={styles.vehicleTagLabel}>Moteur</Text>
                <Text style={styles.vehicleTagText}>{vehicle.engine ?? 'Non renseigné'}</Text>
              </View>
              <View style={styles.vehicleTag}>
                <Text style={styles.vehicleTagLabel}>Carburant</Text>
                <Text style={styles.vehicleTagText}>{vehicle.fuel_type ?? 'Non renseigné'}</Text>
              </View>
              <View style={styles.vehicleTag}>
                <Text style={styles.vehicleTagLabel}>Kilométrage</Text>
                <Text style={styles.vehicleTagText}>{vehicle.mileage != null ? `${vehicle.mileage} km` : 'Non renseigné'}</Text>
              </View>
            </View>

            <View style={styles.vehicleActions}>
              <Pressable style={styles.btnEdit}>
                <Text style={styles.btnEditText}>Modifier</Text>
              </Pressable>
              <Pressable style={styles.btnDelete}>
                <Text style={styles.btnDeleteText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* ── AJOUTER UN VÉHICULE (accordéon) ── */}
      <Pressable
        style={styles.accordionHeader}
        onPress={() => setIsAddVehicleOpen((v) => !v)}
      >
        <Text style={styles.accordionTitle}>Ajouter un véhicule</Text>
        <Image source={CHEVRON_ICON} style={[styles.accordionChevron, isAddVehicleOpen && styles.accordionChevronUp]} />
      </Pressable>

      {isAddVehicleOpen && (
        <View style={styles.card}>

          {/* Marque / Modèle */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Marque</Text>
              <TextInput
                style={styles.input}
                value={vehicleBrand}
                onChangeText={setVehicleBrand}
                placeholder="Marque"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Modèle</Text>
              <TextInput
                style={styles.input}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="Modèle"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Immatriculation / Année */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Immatriculation</Text>
              <TextInput
                style={styles.input}
                value={vehiclePlate}
                onChangeText={setVehiclePlate}
                placeholder="AA-000-AA"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Année</Text>
              <TextInput
                style={styles.input}
                value={vehicleYear}
                onChangeText={setVehicleYear}
                placeholder="Année"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Carburant / Moteur */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Carburant (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={vehicleFuelType}
                onChangeText={setVehicleFuelType}
                placeholder="Essence, Diesel…"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Moteur</Text>
              <TextInput
                style={styles.input}
                value={vehicleEngine}
                onChangeText={setVehicleEngine}
                placeholder="Moteur"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Kilométrage seul */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Kilométrage</Text>
            <TextInput
              style={styles.input}
              value={vehicleMileage}
              onChangeText={setVehicleMileage}
              placeholder="km"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
            />
          </View>
          <Pressable
            style={styles.btnPrimary}
            onPress={() => {
              void onAddVehicle();
            }}
            disabled={isSavingVehicle}
          >
            <Text style={styles.btnPrimaryText}>
              {isSavingVehicle ? 'Ajout...' : 'Ajouter le véhicule'}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={logout} style={styles.logoutText}>
        <Image
          source={require('../../../assets/images/logout.png')}
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutTextLabel}>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    paddingBottom: 40,
    gap: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  infoText: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
  },

  /* ── EN-TÊTE ── */
  header: {
    backgroundColor: '#dbeafe',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 14,
  },
  headerLogo: {
    width: 55,
    height: 28,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  avatar: {
    width: 90,
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
  headerProfileInfo: {
    flex: 1,
    gap: 4,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3fa6',
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a3fa6',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  roleTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerInfoIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    flexShrink: 1,
  },
  editButton: {
    backgroundColor: '#1a3fa6',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  /* ── ERREUR ── */
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    paddingHorizontal: 16,
  },

  /* ── CARD générique ── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.025,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a3fa6',
  },

  /* ── TITRES DE SECTION ── */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    paddingHorizontal: 16,
  },

  /* ── CARTE VÉHICULE ── */
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleNameIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a3fa6',
    flex: 1,
  },
  vehicleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTag: {
    width: '48%',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
  },
  vehicleTagLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  vehicleTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnEdit: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1a3fa6',
    alignItems: 'center',
  },
  btnEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  btnDelete: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  btnDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  /* ── ACCORDÉON AJOUTER UN VÉHICULE ── */
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3fa6',
  },
  accordionChevron: {
    width: 14,
    height: 14,
    tintColor: '#94a3b8',
    marginLeft: 4,
    transform: [{ rotate: '90deg' }],
  },
  accordionChevronUp: {
    transform: [{ rotate: '270deg' }],
  },

  /* ── MISE EN PAGE FORMULAIRES ── */
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroup: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },

  /* ── INPUTS ── */
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },

  /* ── BOUTONS ── */
  rowButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: '#1a3fa6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },

  logoutText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  logoutIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  logoutTextLabel: {
    color: '#1a3fa6',
    fontWeight: '600',
    fontSize: 14,
  },
});
