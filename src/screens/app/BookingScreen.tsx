import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../context/auth/AuthContext';
import { AvailableSlot, BookingStatus, createBooking, getAvailableSlots, getBookingStatuses } from '../../services/api/bookingApi';
import { getMyVehicles } from '../../services/api/profileApi';
import { OpeningHours, OpeningHoursClosed } from '../../types/garage';
import { DriverVehicle } from '../../types/profile';
import { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'BookingScreen'>;

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';

const ADDRESS_ICON = require('../../../assets/images/address.png');
const CHEVRON_ICON = require('../../../assets/images/chevron.png');
const CHECK_ICON = require('../../../assets/images/check.png');

const DAY_JS_TO_KEY: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

const WEEKDAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const isClosedDay = (value: OpeningHours[string]): value is OpeningHoursClosed =>
  typeof value === 'object' && !Array.isArray(value) && value !== null && 'closed' in value;

const isDayOpen = (openingHours: OpeningHours | null, date: Date): boolean => {
  if (!openingHours) return true;
  const key = DAY_JS_TO_KEY[date.getDay()];
  const dayValue = openingHours[key];
  if (!dayValue) return false;
  if (isClosedDay(dayValue)) return false;
  if (Array.isArray(dayValue)) return dayValue.length > 0;
  return true;
};

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const generateNext2Months = (openingHours: OpeningHours | null): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 62; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (isDayOpen(openingHours, d)) {
      days.push(d);
    }
  }
  return days;
};

export function BookingScreen({ route, navigation }: Props) {
  const { garageId, mechanicId, garageName, garageAddress, garageCity, garageImageUrl, services, openingHours } =
    route.params;

  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const [bookingStatuses, setBookingStatuses] = useState<BookingStatus[]>([]);

  const [selectedServiceKeys, setSelectedServiceKeys] = useState<Set<string>>(new Set());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return new Set([key]);
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getMyVehicles(), getBookingStatuses()])
      .then(([v, statuses]) => {
        if (isMounted) {
          setVehicles(v);
          setBookingStatuses(statuses);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setVehiclesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    let isMounted = true;
    setSlotsLoading(true);
    setSelectedSlot(null);
    setAvailableSlots([]);
    getAvailableSlots(garageId, selectedDate)
      .then((slots) => {
        if (isMounted) setAvailableSlots(slots);
      })
      .catch(() => {
        if (isMounted) setAvailableSlots([]);
      })
      .finally(() => {
        if (isMounted) setSlotsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedDate, garageId]);

  const categorizedServices = useMemo(() => {
    if (!services || services.length === 0) return [];
    return services.flatMap((categoryObject) =>
      Object.entries(categoryObject).map(([category, items]) => ({
        category,
        items: Array.isArray(items) ? items : [],
      })),
    );
  }, [services]);

  const availableDates = useMemo(() => generateNext2Months(openingHours), [openingHours]);

  const datesByMonth = useMemo(() => {
    const groups: { key: string; label: string; dates: Date[] }[] = [];
    const map = new Map<string, Date[]>();
    for (const d of availableDates) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) {
        const dates: Date[] = [];
        map.set(key, dates);
        groups.push({ key, label: `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`, dates });
      }
      map.get(key)!.push(d);
    }
    return groups;
  }, [availableDates]);

  const totalPrice = useMemo(() => {
    let total = 0;
    for (const key of selectedServiceKeys) {
      const sepIdx = key.indexOf('::');
      const category = key.slice(0, sepIdx);
      const index = parseInt(key.slice(sepIdx + 2), 10);
      const cat = categorizedServices.find((c) => c.category === category);
      if (cat && cat.items[index]) {
        total += cat.items[index].price;
      }
    }
    return total;
  }, [selectedServiceKeys, categorizedServices]);

  const selectedServiceNames = useMemo(() => {
    const names: string[] = [];
    for (const key of selectedServiceKeys) {
      const sepIdx = key.indexOf('::');
      const category = key.slice(0, sepIdx);
      const index = parseInt(key.slice(sepIdx + 2), 10);
      const cat = categorizedServices.find((c) => c.category === category);
      if (cat && cat.items[index]) names.push(cat.items[index].serviceName);
    }
    return names;
  }, [selectedServiceKeys, categorizedServices]);

  const selectedServiceIds = useMemo(() => {
    const ids: number[] = [];
    for (const key of selectedServiceKeys) {
      const sepIdx = key.indexOf('::');
      const category = key.slice(0, sepIdx);
      const index = parseInt(key.slice(sepIdx + 2), 10);
      const cat = categorizedServices.find((c) => c.category === category);
      if (cat && cat.items[index]) ids.push(cat.items[index].id);
    }
    return ids;
  }, [selectedServiceKeys, categorizedServices]);

  const toggleService = useCallback((key: string) => {
    setSelectedServiceKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const pendingStatusId = bookingStatuses[0]?.id ?? null;

  const canConfirm =
    user !== null &&
    selectedVehicleId !== null &&
    selectedServiceKeys.size > 0 &&
    selectedDate !== null &&
    selectedSlot !== null &&
    pendingStatusId !== null &&
    !submitting;

  const handleConfirm = async () => {
    if (
      !canConfirm ||
      user === null ||
      selectedVehicleId === null ||
      selectedDate === null ||
      selectedSlot === null ||
      pendingStatusId === null
    )
      return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createBooking({
        appointment_date: `${selectedDate}T${selectedSlot}:00`,
        id_mechanic: mechanicId,
        id_booking_status: pendingStatusId,
        id_vehicle: selectedVehicleId,
        service_ids: selectedServiceIds,
      });
      setConfirmedDate(selectedDate);
      setConfirmedSlot(selectedSlot);
      setSubmitSuccess(true);
    } catch {
      setSubmitError('Impossible de créer la réservation. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <ImageBackground
        source={require('../../../assets/images/login.jpg')}
        resizeMode="cover"
        style={styles.successBg}
      >
        <View style={styles.successOverlay}>
          <Image source={CHECK_ICON} style={styles.successCheckIcon} />
          <Text style={styles.successTitle}>Réservation confirmée !</Text>
          <View style={styles.successCard}>
            <Text style={styles.successDate}>
              {confirmedDate
                ? (() => {
                    const d = new Date(confirmedDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    });
                    return d.charAt(0).toUpperCase() + d.slice(1);
                  })()
                : ''}
            </Text>
            <Text style={styles.successTime}>{confirmedSlot ?? ''}</Text>
            <Text style={styles.successGarage}>{garageName}</Text>
          </View>
          <Pressable
            onPress={() => navigation.getParent()?.navigate('Bookings')}
            style={styles.successBackButton}
          >
            <Text style={styles.successBackButtonText}>Voir mes réservations</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <Image
          source={require('../../../assets/images/logo-mecanoo.png')}
          style={styles.headerLogo}
        />

        {/* ── EN-TÊTE GARAGE (style blueHeader de GarageDetailsScreen) ── */}
        <View style={styles.blueHeader}>
          <Image
            source={{ uri: garageImageUrl ?? PLACEHOLDER_IMAGE }}
            style={styles.garageImage}
          />
          <View style={styles.blueHeaderContent}>
            <Text style={styles.cardTitle}>{garageName}</Text>
            <View style={styles.cardInfoRow}>
              <Image source={ADDRESS_ICON} style={styles.cardRowIcon} />
              <Text style={styles.cardAddress}>
                {garageAddress}{garageCity ? `, ${garageCity}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* ── SÉLECTIONNE TON VÉHICULE (grille 2 colonnes, style encarts Profil) ── */}
        <Text style={styles.sectionTitle}>Sélectionne ton véhicule</Text>
        <View style={styles.vehicleSection}>
          {vehiclesLoading ? (
            <ActivityIndicator color="#1a3fa6" style={styles.loader} />
          ) : vehicles.length === 0 ? (
            <Text style={styles.emptyLabel}>Aucun véhicule enregistré.</Text>
          ) : (
            <View style={styles.vehicleGrid}>
              {vehicles.map((vehicle) => {
                const selected = selectedVehicleId === vehicle.id;
                return (
                  <Pressable
                    key={vehicle.id}
                    onPress={() => setSelectedVehicleId(vehicle.id)}
                    style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
                  >
                    <Text style={[styles.vehicleModel, selected && styles.vehicleModelSelected]}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                    {vehicle.license_plate ? (
                      <Text style={[styles.vehiclePlate, selected && styles.vehiclePlateSelected]}>
                        {vehicle.license_plate.toUpperCase()}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ── PRESTATIONS (style GarageDetailsScreen + cases à cocher) ── */}
        <Text style={styles.sectionTitle}>Sélectionne tes prestations</Text>
        {categorizedServices.length === 0 ? (
          <View style={styles.categoryCard}>
            <Text style={styles.emptyLabel}>Aucune prestation disponible.</Text>
          </View>
        ) : (
          categorizedServices.map((cat) => (
            <View key={cat.category} style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>{cat.category}</Text>
              {cat.items.length === 0 ? (
                <Text style={styles.emptyLabel}>Aucune prestation dans cette catégorie.</Text>
              ) : (
                Array.from({ length: Math.ceil(cat.items.length / 2) }, (_, rowIndex) => {
                  const pair = cat.items.slice(rowIndex * 2, rowIndex * 2 + 2);
                  return (
                    <View key={`${cat.category}-row-${rowIndex}`} style={styles.serviceGrid}>
                      {pair.map((service, pairIdx) => {
                        const itemIndex = rowIndex * 2 + pairIdx;
                        const key = `${cat.category}::${itemIndex}`;
                        const checked = selectedServiceKeys.has(key);
                        return (
                          <Pressable
                            key={pairIdx}
                            onPress={() => toggleService(key)}
                            style={[styles.serviceItem, checked && styles.serviceItemChecked]}
                          >
                            <Text style={[styles.serviceName, checked && styles.serviceNameChecked]}>{service.serviceName}</Text>
                            <Text style={[styles.servicePrice, checked && styles.servicePriceChecked]}>{service.price} €</Text>
                          </Pressable>
                        );
                      })}
                      {pair.length === 1 && (
                        <View style={[styles.serviceItem, { backgroundColor: 'transparent' }]} />
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ))
        )}

        {selectedServiceKeys.size > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalPrice}>{totalPrice} €</Text>
          </View>
        )}

        {/* ── CHOISIR UNE DATE ── */}
        <Text style={styles.sectionTitle}>Sélectionne ta date</Text>
        {availableDates.length === 0 ? (
          <View style={styles.categoryCard}>
            <Text style={styles.emptyLabel}>Aucune disponibilité dans les 2 prochains mois.</Text>
          </View>
        ) : (
          datesByMonth.map((monthGroup) => {
            const isExpanded = expandedMonths.has(monthGroup.key);
            return (
              <View key={monthGroup.key} style={styles.categoryCard}>
                <Pressable
                  style={styles.categoryHeader}
                  onPress={() => {
                    setExpandedMonths((prev) => {
                      const next = new Set(prev);
                      if (next.has(monthGroup.key)) next.delete(monthGroup.key);
                      else next.add(monthGroup.key);
                      return next;
                    });
                  }}
                >
                  <Text style={styles.categoryTitle}>{monthGroup.label}</Text>
                  <Image
                    source={CHEVRON_ICON}
                    style={[styles.chevronIcon, isExpanded && styles.chevronUp]}
                  />
                </Pressable>
                {isExpanded && (
                  <View style={styles.datesGrid}>
                    {monthGroup.dates.map((date) => {
                      const dateStr = formatDate(date);
                      const selected = selectedDate === dateStr;
                      return (
                        <Pressable
                          key={dateStr}
                          onPress={() => setSelectedDate(dateStr)}
                          style={[styles.dateCard, selected && styles.dateCardSelected]}
                        >
                          <Text style={[styles.dateWeekday, selected && styles.selectedSubText]}>
                            {WEEKDAY_SHORT[date.getDay()]}
                          </Text>
                          <Text style={[styles.dateDay, selected && styles.selectedText]}>
                            {date.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* ── CHOISIR UN CRÉNEAU ── */}
        {selectedDate ? (
          <>
            <Text style={styles.sectionTitle}>Sélectionne ton créneau</Text>
            <View style={styles.section}>
              {slotsLoading ? (
                <ActivityIndicator color="#1a3fa6" style={styles.loader} />
              ) : availableSlots.length === 0 ? (
                <Text style={styles.emptyLabel}>
                  Aucun créneau disponible pour cette date.
                </Text>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => {
                    const selected = selectedSlot === slot.startTime;
                    return (
                      <Pressable
                        key={slot.startTime}
                        onPress={() => setSelectedSlot(slot.startTime)}
                        style={[styles.slotButton, selected && styles.slotButtonSelected]}
                      >
                        <Text style={[styles.slotText, selected && styles.selectedText]}>
                          {slot.startTime}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        ) : null}


        {/* ── ERREUR ── */}
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        {/* ── BOUTON CONFIRMER ── */}
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmer la réservation</Text>
          )}
        </Pressable>

      </ScrollView>
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
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    gap: 12,
    paddingBottom: 32,
    paddingTop: 0,
  },
  loader: {
    marginVertical: 8,
  },

  headerLogo: {
    width: 55,
    height: 28,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 52,
    marginBottom: 4,
  },

  /* ── EN-TÊTE GARAGE ── */
  blueHeader: {
    backgroundColor: '#dbeafe',
    marginHorizontal: 16,
    paddingBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  garageImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  blueHeaderContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3fa6',
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

  /* ── TITRES DE SECTION ── */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    marginTop: 4,
  },

  /* ── CARD générique (empty state véhicule) ── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 14,
    gap: 6,
    ...cardShadow,
  },

  /* ── BLOC BLANC VÉHICULE ── */
  vehicleSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 12,
    ...cardShadow,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  /* style encart vehicleTag de AccountScreen, agrandi en 2 colonnes */
  vehicleCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    width: '48%',
  },
  vehicleCardSelected: {
    backgroundColor: '#1a3fa6',
  },
  vehicleCheckRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  checkboxCheckedOnDark: {
    backgroundColor: 'transparent',
    borderColor: '#fff',
  },
  vehicleModel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3fa6',
  },
  vehicleModelSelected: {
    color: '#fff',
  },
  vehiclePlate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  vehiclePlateSelected: {
    color: '#fff',
  },

  /* ── PRESTATIONS (style GarageDetailsScreen + checkboxes) ── */
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 14,
    gap: 10,
    ...cardShadow,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  serviceItemChecked: {
    backgroundColor: '#1a3fa6',
  },
  serviceItemTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  serviceItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  checkIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  serviceName: {
    color: '#1e293b',
    fontSize: 13,
    flex: 1,
  },
  serviceNameChecked: {
    color: '#fff',
  },
  servicePrice: {
    color: '#1a3fa6',
    fontWeight: '700',
    fontSize: 16,
    flexShrink: 0,
  },
  servicePriceChecked: {
    color: '#fff',
  },
  emptyLabel: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  /* ── TOTAL ── */
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a3fa6',
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...cardShadow,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },

  /* ── CRÉNEAUX ── */
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    gap: 8,
    ...cardShadow,
  },
  selectedText: {
    color: '#fff',
  },
  selectedSubText: {
    color: '#dbeafe',
  },
  /* chevrons partagés avec les mois */
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
  /* grille de dates */
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dateCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
    alignItems: 'center',
    gap: 1,
    minWidth: 38,
  },
  dateCardSelected: {
    backgroundColor: '#1a3fa6',
  },
  dateWeekday: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#f1f5f9',
  },
  slotButtonSelected: {
    backgroundColor: '#1a3fa6',
    borderColor: '#1a3fa6',
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  /* ── RÉCAPITULATIF ── */
  recapSection: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a3fa6',
    padding: 14,
    marginHorizontal: 16,
    gap: 4,
  },
  recapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3fa6',
    marginBottom: 4,
  },
  recapLine: {
    fontSize: 13,
    color: '#1a3fa6',
  },
  recapTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a3fa6',
    marginTop: 6,
  },

  /* ── ERREUR ── */
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  /* ── BOUTON CONFIRMER ── */
  confirmButton: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: '#1a3fa6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  /* ── ÉCRAN SUCCÈS ── */
  successBg: {
    flex: 1,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(179, 229, 255, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  successCheckIcon: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 4,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  successDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3fa6',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  successTime: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a3fa6',
    textAlign: 'center',
  },
  successGarage: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  successBackButton: {
    marginTop: 16,
    backgroundColor: '#1a3fa6',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  successBackButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
