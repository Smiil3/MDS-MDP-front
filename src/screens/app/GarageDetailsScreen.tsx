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
const PHONE_ICON = require('../../../assets/images/phone.png');
const MAIL_ICON = require('../../../assets/images/mail.png');
const CHEVRON_ICON = require('../../../assets/images/chevron.png');
const PLANNING_ICON = require('../../../assets/images/planning.png');

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
        <Text key={i} style={{ fontSize: size, color: i < filled ? '#f59e0b' : '#94a3b8' }}>
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
    <View style={styles.screen}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={require('../../../assets/images/logo-mecanoo.png')}
        style={styles.headerLogo}
      />
      <View style={styles.blueHeader}>
        <Image source={{ uri: garage.imageUrl ?? PLACEHOLDER_IMAGE }} style={styles.image} />
        <View style={styles.headerContent}>
          <Text style={styles.cardTitle}>{garage.name}</Text>
          {reviewsAverage !== null ? (
            <View style={styles.cardRatingRow}>
              {renderStars(reviewsAverage, 14)}
              <Text style={styles.cardRating}>{reviewsAverage.toFixed(1)}</Text>
              <Text style={styles.reviewsCount}> ({reviewsTotal} avis)</Text>
            </View>
          ) : null}
          <View style={styles.cardInfoRow}>
            <Image source={ADDRESS_ICON} style={styles.cardRowIcon} />
            <Text style={styles.cardAddress}>{garage.address}</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.aboutCard}>
            {garage.description?.trim() ? (
              <>
                <Text style={styles.aboutTitle}>À propos</Text>
                <Text style={styles.description}>{garage.description}</Text>
                <View style={[styles.divider, { backgroundColor: '#94a3b8' }]} />
              </>
            ) : null}
            <View style={styles.infoRow}>
              <Image source={PHONE_ICON} style={styles.infoIconImg} />
              <Text style={[styles.infoValue, !garage.phone && styles.infoEmpty]}>
                {garage.phone ?? 'Non renseigné'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Image source={MAIL_ICON} style={styles.infoIconImg} />
              <Text style={[styles.infoValue, !garage.email && styles.infoEmpty]}>
                {garage.email ?? 'Non renseigné'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bloc blanc — distance */}
      {distanceLabel ? (
        <View style={styles.infoCard}>
          <View style={styles.cardInfoRow}>
            <Image source={DISTANCE_ICON} style={styles.cardRowIcon} />
            <Text style={styles.cardDistance}>À {distanceLabel} de vous</Text>
          </View>
        </View>
      ) : null}

      {/* Prestations */}
      <Text style={styles.sectionTitle}>Prestations</Text>
      {categorizedServices.length === 0 ? (
        <View style={styles.categoryCard}>
          <Text style={styles.emptyLabel}>Aucune prestation renseignée.</Text>
        </View>
      ) : (
        categorizedServices.map((category) => {
          const isExpanded = !!expandedCategories[category.category];
          return (
            <View key={category.category} style={styles.categoryCard}>
              <Pressable
                onPress={() => setExpandedCategories((prev) => ({ ...prev, [category.category]: !prev[category.category] }))}
                style={styles.categoryHeader}
              >
                <Text style={styles.categoryTitle}>{category.category}</Text>
                <Image source={CHEVRON_ICON} style={[styles.chevronIcon, isExpanded && styles.chevronUp]} />
              </Pressable>
              {isExpanded && (
                category.items.length === 0 ? (
                  <Text style={styles.emptyLabel}>Aucune prestation dans cette catégorie.</Text>
                ) : (
                  Array.from({ length: Math.ceil(category.items.length / 2) }, (_, rowIndex) => {
                    const pair = category.items.slice(rowIndex * 2, rowIndex * 2 + 2);
                    return (
                      <View key={`${category.category}-row-${rowIndex}`} style={styles.serviceGrid}>
                        {pair.map((service, i) => (
                          <View key={i} style={styles.serviceItem}>
                            <Text style={styles.serviceName}>{service.serviceName}</Text>
                            <Text style={styles.servicePrice}>{service.price} €</Text>
                          </View>
                        ))}
                        {pair.length === 1 && <View style={[styles.serviceItem, { backgroundColor: 'transparent' }]} />}
                      </View>
                    );
                  })
                )
              )}
            </View>
          );
        })
      )}

      {/* Horaires */}
      <Text style={styles.sectionTitle}>Horaires</Text>
      <View style={styles.section}>
        {DAY_KEYS.map((day, index) => {
          const slot = renderDaySlots(garage.openingHours, day);
          const isClosed = slot === 'Fermé';
          return (
            <View key={day}>
              <View style={styles.dayRow}>
                <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                <Text style={[styles.dayValue, isClosed && styles.dayValueClosed]}>{slot}</Text>
              </View>
              {index < DAY_KEYS.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>

      {/* Avis clients — notation visible, liste dépliable */}
      <Text style={styles.sectionTitle}>Avis clients</Text>
      <View style={styles.section}>
        <Pressable
          onPress={() => setReviewsExpanded((v) => !v)}
          style={styles.reviewsHeader}
        >
          {reviewsAverage !== null ? (
            <>
              <View style={styles.reviewsSummaryRow}>
                {renderStars(reviewsAverage, 14)}
                <Text style={styles.reviewsSummaryText}>{reviewsAverage.toFixed(1)}/5</Text>
              </View>
              <View style={styles.reviewsSummaryRow}>
                <Text style={styles.reviewsCount}>{reviewsTotal} avis</Text>
                <Image source={CHEVRON_ICON} style={[styles.chevronIcon, reviewsExpanded && styles.chevronUp]} />
              </View>
            </>
          ) : (
            <Image source={CHEVRON_ICON} style={[styles.chevronIcon, reviewsExpanded && styles.chevronUp]} />
          )}
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

    </ScrollView>

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
      style={styles.fab}
    >
      <Image source={PLANNING_ICON} style={styles.fabIcon} />
    </Pressable>
    </View>
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
    paddingBottom: 100,
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
    marginHorizontal: 16,
    paddingBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 55,
    height: 28,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 52,
  },
  image: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3fa6',
    flex: 1,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  cardRating: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  sectionTitleInner: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  aboutCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  hoursCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 10,
    gap: 6,
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
  infoIconImg: {
    width: 15,
    height: 15,
    tintColor: '#1a3fa6',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a3fa6',
    fontWeight: '600',
  },
  infoEmpty: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  spacer: {
    height: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  hoursContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dayValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a3fa6',
  },
  dayValueClosed: {
    color: '#94a3b8',
    fontStyle: 'italic',
    fontWeight: '400',
  },

  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a3fa6',
    textTransform: 'capitalize',
  },
  serviceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceItem: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  serviceName: {
    color: '#1e293b',
    fontSize: 13,
  },
  servicePrice: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyLabel: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewsSummaryText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  reviewsCount: {
    fontSize: 13,
    color: '#94a3b8',
  },
  chevronIcon: {
    width: 14,
    height: 14,
    tintColor: '#94a3b8',
    marginLeft: 4,
    transform: [{ rotate: '90deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '270deg' }],
  },
  reviewCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
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
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1a3fa6',
    marginTop: 4,
  },
  loadMoreText: {
    color: '#1a3fa6',
    fontWeight: '600',
    fontSize: 14,
  },

  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  /* Bouton FAB réserver */
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#1a3fa6',
    borderRadius: 999,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
});
