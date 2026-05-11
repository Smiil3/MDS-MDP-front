import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getGarageDetails, getGarageReviews } from '../../services/api/garageApi';
import { GarageCard, GarageService, GarageServices, OpeningHours, GarageReview } from '../../types/garage';
import { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'GarageDetails'>;

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';

const ADDRESS_ICON = require('../../../assets/images/address.png');
const DISTANCE_ICON = require('../../../assets/images/navigation.png');

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
): value is { closed: true } =>
  typeof value === 'object' && !Array.isArray(value) && value !== null && 'closed' in value;

const renderDaySlots = (openingHours: OpeningHours | null, day: (typeof DAY_KEYS)[number]) => {
  if (!openingHours) return 'Non renseigné';
  const dayValue = openingHours[day];
  if (!dayValue) return 'Non renseigné';
  if (Array.isArray(dayValue)) {
    if (dayValue.length === 0) return 'Fermé';
    return dayValue.map((slot) => `${slot.open}-${slot.close}`).join(' • ');
  }
  if (isClosedDay(dayValue)) return 'Fermé';
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

const formatDistance = (distanceMeters: number | null) => {
  if (distanceMeters === null) return null;
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const normalizeServices = (services: GarageServices | null): Array<{ category: string; items: GarageService[] }> => {
  if (!services || services.length === 0) return [];
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

  useEffect(() => {
    let isMounted = true;
    const loadGarage = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getGarageDetails(garageId);
        if (!isMounted) return;
        setGarage(data);
      } catch {
        if (isMounted) {
          setErrorMessage("Impossible de charger les détails du garage pour l'instant.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadGarage().catch(() => {
      if (isMounted) {
        setErrorMessage("Impossible de charger les détails du garage pour l'instant.");
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [garageId]);

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
  const distanceLabel = useMemo(() => formatDistance(garage?.distanceMeters ?? null), [garage?.distanceMeters]);

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
      {/* Zone bleue — image + titre + adresse */}
      <View style={styles.blueHeader}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Image source={{ uri: garage.imageUrl ?? PLACEHOLDER_IMAGE }} style={styles.image} />
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{garage.name}</Text>
          {reviewsAverage !== null ? (
            <Text style={styles.cardRating}>⭐ {reviewsAverage.toFixed(1)}</Text>
          ) : null}
        </View>
        <View style={styles.cardInfoRow}>
          <Image source={ADDRESS_ICON} style={styles.cardRowIcon} />
          <Text style={styles.cardAddress}>{garage.address}</Text>
        </View>
      </View>

      {/* Bloc blanc — distance, À propos */}
      <View style={styles.infoCard}>
        {distanceLabel ? (
          <View style={styles.cardInfoRow}>
            <Image source={DISTANCE_ICON} style={styles.cardRowIcon} />
            <Text style={styles.cardDistance}>À {distanceLabel} de vous</Text>
          </View>
        ) : null}
        {garage.description?.trim() ? (
          <>
            <View style={styles.spacer} />
            <Text style={styles.aboutTitle}>À propos</Text>
            <Text style={styles.description}>{garage.description}</Text>
          </>
        ) : null}
      </View>

      {/* Prestations */}
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

      {/* Infos pratiques — fixe (contact + horaires) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Infos pratiques</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={[styles.infoValue, !garage.phone && styles.infoEmpty]}>
            {garage.phone ?? 'Non renseigné'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>✉️</Text>
          <Text style={[styles.infoValue, !garage.email && styles.infoEmpty]}>
            {garage.email ?? 'Non renseigné'}
          </Text>
        </View>
        <View style={styles.spacer} />
        {DAY_KEYS.map((day) => (
          <View key={day} style={styles.row}>
            <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
            <Text style={styles.dayValue}>{renderDaySlots(garage.openingHours, day)}</Text>
          </View>
        ))}
      </View>

      {/* Avis clients — notation visible, liste dépliable */}
      <View style={styles.section}>
        {reviewsAverage !== null ? (
          <View style={styles.reviewsSummaryRow}>
            {renderStars(reviewsAverage, 18)}
            <Text style={styles.reviewsSummaryText}>
              {reviewsAverage.toFixed(1)}/5 · {reviewsTotal} avis
            </Text>
          </View>
        ) : null}

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

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.025,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 5 },
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    gap: 12,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 24,
  },
  /* Zone bleue en haut */
  blueHeader: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 12,
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#1a3fa6',
    lineHeight: 22,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },

  /* Bloc blanc — adresse, distance, À propos */
  infoCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
    ...cardShadow,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3fa6',
    flex: 1,
  },
  cardRating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardRowIcon: {
    width: 13,
    height: 13,
  },
  cardAddress: {
    fontSize: 13,
    color: '#94a3b8',
    flexShrink: 1,
  },
  cardDistance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a3fa6',
  },

  /* Sections */
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    gap: 8,
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },

  /* Infos pratiques */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    color: '#334155',
  },
  infoEmpty: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  spacer: {
    height: 8,
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

  /* Prestations */
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

  /* Avis clients */
  reviewsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    padding: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
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
    borderColor: '#1a3fa6',
    marginTop: 4,
  },
  loadMoreText: {
    color: '#1a3fa6',
    fontWeight: '600',
    fontSize: 14,
  },

  /* Bouton réserver */
  reserveButton: {
    marginTop: 6,
    marginHorizontal: 16,
    backgroundColor: '#1a3fa6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...cardShadow,
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
