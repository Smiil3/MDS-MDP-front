import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';

import { getGarageDetails, getGarageReviews } from '../../services/api/garageApi';
import { GarageCard, GarageReview, GarageService, GarageServices, OpeningHours } from '../../types/garage';
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

const renderStars = (rating: number, size = 15) => {
  const filled = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < filled ? '#f59e0b' : '#d1d5db' }}>
          ★
        </Text>
      ))}
    </View>
  );
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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

export function GarageDetailsScreen({ route, navigation }: Props) {
  const { garageId } = route.params;

  const [garage, setGarage] = useState<GarageCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsAverage, setReviewsAverage] = useState<number | null>(null);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);

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

  // Load page 1 on mount for the summary (average + total)
  useEffect(() => {
    let isMounted = true;
    const loadSummary = async () => {
      try {
        const data = await getGarageReviews(garageId, 1);
        if (!isMounted) return;
        setReviews(data.reviews);
        setReviewsAverage(data.average);
        setReviewsTotal(data.total);
        setReviewsTotalPages(data.totalPages);
      } catch {}
    };
    loadSummary();
    return () => { isMounted = false; };
  }, [garageId]);

  // Load additional pages when the user taps "Voir plus"
  useEffect(() => {
    if (reviewsPage === 1) return;
    let isMounted = true;
    const loadMore = async () => {
      setReviewsLoading(true);
      try {
        const data = await getGarageReviews(garageId, reviewsPage);
        if (!isMounted) return;
        setReviews((prev) => [...prev, ...data.reviews]);
        setReviewsTotalPages(data.totalPages);
      } catch {} finally {
        if (isMounted) setReviewsLoading(false);
      }
    };
    loadMore();
    return () => { isMounted = false; };
  }, [reviewsPage, garageId]);

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

      {/* Reviews summary */}
      {reviewsAverage !== null && (
        <View style={styles.reviewsSummary}>
          {renderStars(reviewsAverage, 18)}
          <Text style={styles.reviewsSummaryText}>
            {reviewsAverage.toFixed(1)}/5 — {reviewsTotal} avis
          </Text>
        </View>
      )}

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

      {/* Horaires accordion */}
      <View style={styles.section}>
        <Pressable
          onPress={() => setHoursExpanded((v) => !v)}
          style={styles.reviewsHeader}
        >
          <Text style={styles.sectionTitle}>Horaires</Text>
          <Text style={styles.reviewsChevron}>{hoursExpanded ? '▲' : '▼'}</Text>
        </Pressable>

        {hoursExpanded && DAY_KEYS.map((day) => (
          <View key={day} style={styles.row}>
            <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
            <Text style={styles.dayValue}>{renderDaySlots(garage.openingHours, day)}</Text>
          </View>
        ))}
      </View>

      {/* Reviews accordion */}
      <View style={styles.section}>
        <Pressable
          onPress={() => setReviewsExpanded((v) => !v)}
          style={styles.reviewsHeader}
        >
          <Text style={styles.sectionTitle}>Avis clients</Text>
          <Text style={styles.reviewsChevron}>{reviewsExpanded ? '▲' : '▼'}</Text>
        </Pressable>

        {reviewsExpanded && (
          <>
            {reviews.length === 0 && !reviewsLoading ? (
              <Text style={styles.emptyLabel}>Aucun avis pour ce garage.</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id_review} style={styles.reviewCard}>
                  <View style={styles.reviewCardTop}>
                    <Text style={styles.reviewAuthor}>
                      {review.driver.first_name} {review.driver.last_name}
                    </Text>
                    <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
                  </View>
                  {renderStars(review.rating)}
                  {review.description?.trim() ? (
                    <Text style={styles.reviewComment}>{review.description}</Text>
                  ) : null}
                </View>
              ))
            )}

            {reviewsLoading && (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 8 }} />
            )}

            {!reviewsLoading && reviewsPage < reviewsTotalPages && (
              <Pressable
                onPress={() => setReviewsPage((p) => p + 1)}
                style={styles.loadMoreButton}
              >
                <Text style={styles.loadMoreText}>Voir plus</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <Pressable
        onPress={() => {
          navigation.navigate('BookingScreen', {
            garageId: garage.id,
            mechanicId: garage.id,
            garageName: garage.name,
            garageAddress: garage.address,
            garageCity: garage.city,
            garageImageUrl: garage.imageUrl,
            services: garage.services,
            openingHours: garage.openingHours,
          });
        }}
        style={styles.reserveButton}
      >
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
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reviewsSummaryText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsChevron: {
    fontSize: 13,
    color: '#64748b',
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 6,
  },
  reviewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  reviewAuthor: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 14,
    flexShrink: 1,
  },
  reviewDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  loadMoreButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    marginTop: 4,
  },
  loadMoreText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
});
