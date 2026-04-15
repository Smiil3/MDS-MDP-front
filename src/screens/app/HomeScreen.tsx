import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getNearbyGarages } from '../../services/api/garageApi';
import { GarageCard, OpeningHours } from '../../types/garage';

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
} => 'closed' in value && value.closed === true;

const formatOpeningHours = (openingHours: OpeningHours | null): string => {
  if (!openingHours) {
    return 'Horaires non renseignés';
  }

  const firstEntry = Object.entries(openingHours).find(([, value]) =>
    isClosedDay(value) ? false : Boolean(value.open && value.close),
  );

  if (!firstEntry) {
    return 'Horaires non renseignés';
  }

  const [dayKey, value] = firstEntry;
  if (isClosedDay(value)) {
    return `${DAY_LABELS[dayKey] ?? dayKey}: fermé`;
  }

  return `${DAY_LABELS[dayKey] ?? dayKey}: ${value.open}-${value.close}`;
};

export function HomeScreen() {
  const [garages, setGarages] = useState<GarageCard[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

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
    let isMounted = true;
    const timeout = setTimeout(() => {
      const fetchGarages = async () => {
        try {
          setIsLoading(true);
          setErrorMessage(null);

          const response = await getNearbyGarages({
            lat: coords?.lat,
            lng: coords?.lng,
            search,
            limit: 5,
          });

          if (!isMounted) {
            return;
          }

          setGarages(response.garages);
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
  }, [coords, search]);

  const emptyStateText = useMemo(() => {
    if (isLoading) {
      return null;
    }

    if (search.trim()) {
      return 'Aucun garage trouvé pour cette recherche.';
    }

    return 'Aucun garage disponible pour le moment.';
  }, [isLoading, search]);

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
          Localisation refusée: affichage des garages triés par défaut (sans distance).
        </Text>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={garages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={garages.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={emptyStateText ? <Text style={styles.emptyText}>{emptyStateText}</Text> : null}
          renderItem={({ item }) => {
            const distanceLabel = formatDistance(item.distanceMeters);
            return (
              <View style={styles.card}>
                <Image source={{ uri: item.imageUrl ?? PLACEHOLDER_IMAGE }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardCity}>{item.city}</Text>
                  {distanceLabel ? <Text style={styles.cardDistance}>À {distanceLabel}</Text> : null}
                  <Text style={styles.cardHours}>{formatOpeningHours(item.openingHours)}</Text>
                  <Text numberOfLines={2} style={styles.cardDescription}>
                    {item.description?.trim() || 'Description à venir.'}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
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
    paddingTop: 14,
    paddingBottom: 20,
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
});
