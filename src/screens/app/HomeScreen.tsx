import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GarageMap } from '../../components/home/GarageMap';
import {
  CARDS_VIEW_LIMIT,
  getNearbyGarages,
  MAP_VIEW_LIMIT,
} from '../../services/api/garageApi';
import { GarageCard, OpeningHours } from '../../types/garage';
import { HomeStackParamList } from '../../types/navigation';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';

const DAY_LABELS: Record<string, string> = {
  mon: 'Lun',
  tue: 'Mar',
  wed: 'Mer',
  thu: 'Jeu',
  fri: 'Ven',
  sat: 'Sam',
  sun: 'Dim',
};

type ViewMode = 'cards' | 'map';
type Props = NativeStackScreenProps<HomeStackParamList, 'HomeList'>;

const formatDistance = (distanceMeters: number | null) => {
  if (distanceMeters === null) {
    return null;
  }

  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const isClosedDay = (
  value: OpeningHours[string],
): value is {
  closed: true;
} => typeof value === 'object' && !Array.isArray(value) && value !== null && 'closed' in value;

const formatOpeningHours = (openingHours: OpeningHours | null): string => {
  if (!openingHours) {
    return 'Horaires non renseignés';
  }

  const firstEntry = Object.entries(openingHours).find(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0 && Boolean(value[0]?.open && value[0]?.close);
    }
    return isClosedDay(value) ? false : Boolean(value.open && value.close);
  });

  if (!firstEntry) {
    return 'Horaires non renseignés';
  }

  const [dayKey, value] = firstEntry;
  if (Array.isArray(value)) {
    const firstSlot = value[0];
    if (!firstSlot) {
      return 'Horaires non renseignés';
    }
    return `${DAY_LABELS[dayKey] ?? dayKey}: ${firstSlot.open}-${firstSlot.close}`;
  }

  if (isClosedDay(value)) {
    return `${DAY_LABELS[dayKey] ?? dayKey}: fermé`;
  }

  return `${DAY_LABELS[dayKey] ?? dayKey}: ${value.open}-${value.close}`;
};

const hasGarageCoordinates = (garage: GarageCard) =>
  typeof garage.latitude === 'number' && typeof garage.longitude === 'number';

export function HomeScreen({ navigation }: Props) {
  const [garages, setGarages] = useState<GarageCard[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedGarage, setSelectedGarage] = useState<GarageCard | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestLocation = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        if (isMounted) {
          setLocationDenied(true);
          setCoords(null);
        }
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (isMounted) {
        setCoords({
          lat: current.coords.latitude,
          lng: current.coords.longitude,
        });
        setLocationDenied(false);
      }
    };

    requestLocation().catch(() => {
      if (isMounted) {
        setLocationDenied(true);
        setCoords(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (locationDenied && viewMode === 'map') {
      setViewMode('cards');
      setSelectedGarage(null);
    }
  }, [locationDenied, viewMode]);

  useEffect(() => {
    let isMounted = true;

    if (viewMode === 'map' && !coords) {
      setGarages([]);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const timeout = setTimeout(() => {
      const fetchGarages = async () => {
        try {
          setIsLoading(true);
          setErrorMessage(null);

          const response = await getNearbyGarages({
            lat: coords?.lat,
            lng: coords?.lng,
            search,
            limit: viewMode === 'map' ? MAP_VIEW_LIMIT : CARDS_VIEW_LIMIT,
          });

          if (!isMounted) {
            return;
          }

          setGarages(response.garages);
          setSelectedGarage((current) => {
            if (!current) {
              return null;
            }
            return response.garages.find((garage) => garage.id === current.id) ?? null;
          });
        } catch {
          if (isMounted) {
            setErrorMessage("Impossible de charger les garages pour l'instant.");
            setGarages([]);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      fetchGarages().catch(() => {
        if (isMounted) {
          setErrorMessage("Impossible de charger les garages pour l'instant.");
          setIsLoading(false);
        }
      });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [coords, search, viewMode]);

  const emptyStateText = useMemo(() => {
    if (isLoading) {
      return null;
    }

    if (search.trim()) {
      return 'Aucun garage trouvé pour cette recherche.';
    }

    return viewMode === 'map'
      ? 'Aucun garage géolocalisé disponible autour de vous.'
      : 'Aucun garage disponible pour le moment.';
  }, [isLoading, search, viewMode]);

  const hasGeolocation = Boolean(coords) && !locationDenied;
  const garagesWithCoordinates = useMemo(
    () => garages.filter(hasGarageCoordinates),
    [garages],
  );

  const openGarageNavigation = async (garage: GarageCard) => {
    if (!hasGarageCoordinates(garage)) {
      setErrorMessage('Navigation indisponible: coordonnées du garage manquantes.');
      return;
    }

    setErrorMessage(null);

    const destination = `${garage.latitude},${garage.longitude}`;
    const encodedName = encodeURIComponent(garage.name);
    const defaultSystemUrl =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}&q=${encodedName}`
        : `geo:0,0?q=${destination}(${encodedName})`;
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    try {
      if (await Linking.canOpenURL(defaultSystemUrl)) {
        await Linking.openURL(defaultSystemUrl);
        return;
      }
      if (await Linking.canOpenURL(fallbackUrl)) {
        await Linking.openURL(fallbackUrl);
        return;
      }

      setErrorMessage("Impossible d'ouvrir la navigation pour ce garage.");
    } catch {
      setErrorMessage("Impossible d'ouvrir la navigation pour ce garage.");
    }
  };

  const openGarageDetails = (garage: GarageCard) => {
    navigation.navigate('GarageDetails', { garageId: garage.id });
  };

  const renderGarageCard = (item: GarageCard, withDetailsNavigation = false) => {
    const distanceLabel = formatDistance(item.distanceMeters);
    const canNavigate = hasGarageCoordinates(item);
    return (
      <Pressable
        disabled={!withDetailsNavigation}
        onPress={() => openGarageDetails(item)}
        style={({ pressed }) => [styles.card, pressed && withDetailsNavigation ? styles.cardPressed : null]}
      >
        <Image source={{ uri: item.imageUrl ?? PLACEHOLDER_IMAGE }} style={styles.cardImage} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCity}>{item.city}</Text>
          {distanceLabel ? <Text style={styles.cardDistance}>À {distanceLabel}</Text> : null}
          <Text style={styles.cardHours}>{formatOpeningHours(item.openingHours)}</Text>
          <Text numberOfLines={2} style={styles.cardDescription}>
            {item.description?.trim() || 'Description à venir.'}
          </Text>
          <Pressable
            disabled={!canNavigate}
            onPress={(event) => {
              event.stopPropagation();
              void openGarageNavigation(item);
            }}
            style={[styles.navigateButton, !canNavigate ? styles.navigateButtonDisabled : null]}
          >
            <Text style={[styles.navigateButtonText, !canNavigate ? styles.navigateButtonTextDisabled : null]}>
              Naviguer
            </Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Garages autour de moi</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher par nom ou ville"
        style={styles.searchInput}
      />

      {locationDenied ? (
        <Text style={styles.infoText}>
          Localisation refusée: vue carte indisponible, affichage en cards par défaut.
        </Text>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : viewMode === 'cards' ? (
          <FlatList
            data={garages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={garages.length === 0 ? styles.emptyContainer : styles.listContent}
            ListEmptyComponent={emptyStateText ? <Text style={styles.emptyText}>{emptyStateText}</Text> : null}
            renderItem={({ item }) => renderGarageCard(item, true)}
          />
        ) : (
          <View style={styles.mapContainer}>
            <GarageMap
              garages={garagesWithCoordinates}
              userCoords={coords}
              selectedGarageId={selectedGarage?.id ?? null}
              onSelectGarage={setSelectedGarage}
              onMapPress={() => setSelectedGarage(null)}
            />
            {garagesWithCoordinates.length === 0 ? (
              <View style={styles.mapEmptyOverlay}>
                <Text style={styles.mapEmptyText}>{emptyStateText}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {viewMode === 'map' && selectedGarage ? (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Garage sélectionné</Text>
            <Pressable onPress={() => setSelectedGarage(null)}>
              <Text style={styles.bottomSheetClose}>Fermer</Text>
            </Pressable>
          </View>
          {renderGarageCard(selectedGarage, false)}
        </View>
      ) : null}

      <View style={styles.modeSelector}>
        <Pressable
          onPress={() => {
            setViewMode('cards');
            setSelectedGarage(null);
          }}
          style={[styles.modeButton, viewMode === 'cards' ? styles.modeButtonActive : null]}
        >
          <Text style={[styles.modeButtonText, viewMode === 'cards' ? styles.modeButtonTextActive : null]}>
            Cards
          </Text>
        </Pressable>
        <Pressable
          disabled={!hasGeolocation}
          onPress={() => setViewMode('map')}
          style={[
            styles.modeButton,
            viewMode === 'map' ? styles.modeButtonActive : null,
            !hasGeolocation ? styles.modeButtonDisabled : null,
          ]}
        >
          <Text style={[styles.modeButtonText, viewMode === 'map' ? styles.modeButtonTextActive : null]}>
            Map
          </Text>
        </Pressable>
      </View>

      {!hasGeolocation ? (
        <View style={styles.modeHint}>
          <Text style={styles.modeHintText}>Autorisez la localisation pour activer la carte.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  infoText: {
    marginTop: 10,
    fontSize: 13,
    color: '#475569',
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: '#b91c1c',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 2,
    paddingBottom: 140,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#334155',
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardImage: {
    width: 110,
    height: 110,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardCity: {
    fontSize: 13,
    color: '#334155',
  },
  cardDistance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  cardHours: {
    fontSize: 13,
    color: '#0f766e',
  },
  cardDescription: {
    fontSize: 12,
    color: '#475569',
  },
  navigateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#1d4ed8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  navigateButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  navigateButtonText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  navigateButtonTextDisabled: {
    color: '#475569',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dbe3ef',
  },
  mapEmptyOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  mapEmptyText: {
    color: '#f8fafc',
    fontSize: 13,
    textAlign: 'center',
  },
  modeSelector: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    padding: 4,
    gap: 4,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  modeButtonActive: {
    backgroundColor: '#1d4ed8',
  },
  modeButtonDisabled: {
    opacity: 0.45,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modeButtonTextActive: {
    color: '#f8fafc',
  },
  modeHint: {
    position: 'absolute',
    bottom: 74,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  modeHintText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  bottomSheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 86,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    padding: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  bottomSheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  bottomSheetClose: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
});
