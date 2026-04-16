import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';

import { getGarageDetails } from '../../services/api/garageApi';
import { GarageCard, GarageService, GarageServices, OpeningHours } from '../../types/garage';
import { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'GarageDetails'>;

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

const isClosedDay = (
  value: OpeningHours[string],
): value is {
  closed: true;
} => typeof value === 'object' && !Array.isArray(value) && value !== null && 'closed' in value;

const renderDaySlots = (openingHours: OpeningHours | null, day: (typeof DAY_KEYS)[number]) => {
  if (!openingHours) {
    return 'Non renseigné';
  }

  const dayValue = openingHours[day];
  if (!dayValue) {
    return 'Non renseigné';
  }

  if (Array.isArray(dayValue)) {
    if (dayValue.length === 0) {
      return 'Fermé';
    }
    return dayValue.map((slot) => `${slot.open}-${slot.close}`).join(' • ');
  }

  if (isClosedDay(dayValue)) {
    return 'Fermé';
  }

  return `${dayValue.open}-${dayValue.close}`;
};

const normalizeServices = (services: GarageServices | null): Array<{ category: string; items: GarageService[] }> => {
  if (!services || services.length === 0) {
    return [];
  }

  return services.flatMap((categoryObject) =>
    Object.entries(categoryObject).map(([category, items]) => ({
      category,
      items: Array.isArray(items) ? items : [],
    })),
  );
};

export function GarageDetailsScreen({ route }: Props) {
  const { garageId } = route.params;

  const [garage, setGarage] = useState<GarageCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadGarage = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getGarageDetails(garageId);
        if (!isMounted) {
          return;
        }
        setGarage(data);
      } catch {
        if (isMounted) {
          setErrorMessage("Impossible de charger les détails du garage pour l'instant.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadGarage().catch(() => {
      if (isMounted) {
        setErrorMessage("Impossible de charger les détails du garage pour l'instant.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [garageId]);

  const categorizedServices = useMemo(() => normalizeServices(garage?.services ?? null), [garage?.services]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (errorMessage || !garage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage ?? 'Garage introuvable.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: garage.imageUrl ?? PLACEHOLDER_IMAGE }} style={styles.image} />

      <Text style={styles.title}>{garage.name}</Text>
      <Text style={styles.subTitle}>{garage.city}</Text>
      <Text style={styles.address}>{garage.address}</Text>

      {garage.description?.trim() ? <Text style={styles.description}>{garage.description}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horaires</Text>
        {DAY_KEYS.map((day) => (
          <View key={day} style={styles.row}>
            <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
            <Text style={styles.dayValue}>{renderDaySlots(garage.openingHours, day)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestations</Text>
        {categorizedServices.length === 0 ? (
          <Text style={styles.emptyLabel}>Aucune prestation renseignée.</Text>
        ) : (
          categorizedServices.map((category) => (
            <View key={category.category} style={styles.categoryBlock}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              {category.items.length === 0 ? (
                <Text style={styles.emptyLabel}>Aucune prestation dans cette catégorie.</Text>
              ) : (
                category.items.map((service, index) => (
                  <View key={`${category.category}-${index}`} style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{service.serviceName}</Text>
                    <Text style={styles.servicePrice}>{service.price} €</Text>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </View>

      <Pressable onPress={() => {}} style={styles.reserveButton}>
        <Text style={styles.reserveButtonText}>Réserver</Text>
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
    gap: 12,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#475569',
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayLabel: {
    color: '#334155',
    fontWeight: '600',
  },
  dayValue: {
    color: '#0f766e',
    flexShrink: 1,
    textAlign: 'right',
  },
  categoryBlock: {
    gap: 6,
    paddingTop: 4,
  },
  categoryTitle: {
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  serviceName: {
    color: '#1e293b',
    flexShrink: 1,
  },
  servicePrice: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  emptyLabel: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  reserveButton: {
    marginTop: 6,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
});
