import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { GarageCard } from '../../types/garage';
import { HomeStackParamList } from '../../types/navigation';
import { GarageCardItem } from '../../components/home/GarageCardItem';

type ViewMode = 'cards' | 'map';
type Props = NativeStackScreenProps<HomeStackParamList, 'HomeList'>;

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

  const openGarageDetails = (garage: GarageCard) => {
    navigation.navigate('GarageDetails', { garageId: garage.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../../assets/images/logo-mecanoo.png')} style={styles.headerLogo} />
        <Text style={styles.title}>Les garages proches de vous</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom ou ville"
          style={styles.searchInput}
        />
      </View>

      {locationDenied ? (
        <Text style={styles.infoText}>
          Localisation refusée: vue carte indisponible, affichage en liste par défaut.
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
            renderItem={({ item }) => (
              <GarageCardItem
                item={item}
                onPress={() => openGarageDetails(item)}
              />
            )}
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
          <GarageCardItem item={selectedGarage} />
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
            Liste
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
            Carte
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
  },
  header: {
    backgroundColor: '#dbeafe',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerLogo: {
    width: 55,
    height: 28,
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3fa6',
    marginTop: 10,
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  searchInput: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  infoText: {
    marginTop: 10,
    marginHorizontal: 16,
    fontSize: 13,
    color: '#475569',
  },
  errorText: {
    marginTop: 10,
    marginHorizontal: 16,
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
    backgroundColor: '#1a3fa6',
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
