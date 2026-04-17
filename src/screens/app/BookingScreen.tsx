import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
        total_amount: totalPrice,
        id_mechanic: mechanicId,
        id_booking_status: pendingStatusId,
        id_driver: user.id,
        id_vehicle: selectedVehicleId,
      });
      setSubmitSuccess(true);
    } catch {
      setSubmitError('Impossible de créer la réservation. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <View style={styles.centered}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Réservation confirmée !</Text>
        <Text style={styles.successText}>
          Votre rendez-vous chez {garageName} a bien été enregistré.
        </Text>
        <Pressable onPress={() => navigation.popToTop()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour à l'accueil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Garage header */}
      <Image
        source={{ uri: garageImageUrl ?? PLACEHOLDER_IMAGE }}
        style={styles.image}
      />
      <Text style={styles.garageName}>{garageName}</Text>
      <Text style={styles.garageCity}>{garageCity}</Text>
      <Text style={styles.garageAddress}>{garageAddress}</Text>

      {/* Vehicle selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Votre véhicule</Text>
        {vehiclesLoading ? (
          <ActivityIndicator color="#2563eb" style={styles.loader} />
        ) : vehicles.length === 0 ? (
          <Text style={styles.emptyLabel}>Aucun véhicule enregistré.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {vehicles.map((vehicle) => {
              const selected = selectedVehicleId === vehicle.id;
              return (
                <Pressable
                  key={vehicle.id}
                  onPress={() => setSelectedVehicleId(vehicle.id)}
                  style={[styles.vehicleCard, selected && styles.cardSelected]}
                >
                  <Text style={[styles.vehicleModel, selected && styles.selectedText]}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text style={[styles.vehicleSub, selected && styles.selectedSubText]}>
                    {vehicle.year} · {vehicle.engine}
                  </Text>
                  {vehicle.license_plate ? (
                    <Text style={[styles.vehiclePlate, selected && styles.selectedSubText]}>
                      {vehicle.license_plate}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Service selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestations</Text>
        {categorizedServices.length === 0 ? (
          <Text style={styles.emptyLabel}>Aucune prestation disponible.</Text>
        ) : (
          categorizedServices.map((cat) => (
            <View key={cat.category} style={styles.categoryBlock}>
              <Text style={styles.categoryTitle}>{cat.category}</Text>
              {cat.items.map((service, index) => {
                const key = `${cat.category}::${index}`;
                const checked = selectedServiceKeys.has(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleService(key)}
                    style={[styles.serviceRow, checked && styles.serviceRowSelected]}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                    <Text
                      style={[styles.serviceName, checked && styles.serviceNameSelected]}
                      numberOfLines={2}
                    >
                      {service.serviceName}
                    </Text>
                    <Text style={[styles.servicePrice, checked && styles.servicePriceSelected]}>
                      {service.price} €
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
        {selectedServiceKeys.size > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total estimé</Text>
            <Text style={styles.totalPrice}>{totalPrice} €</Text>
          </View>
        )}
      </View>

      {/* Date selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choisir une date</Text>
        {availableDates.length === 0 ? (
          <Text style={styles.emptyLabel}>
            Aucune disponibilité dans les 2 prochains mois.
          </Text>
        ) : (
          datesByMonth.map((monthGroup) => {
            const isExpanded = expandedMonths.has(monthGroup.key);
            return (
              <View key={monthGroup.key} style={styles.monthGroup}>
                <Pressable
                  style={styles.monthHeader}
                  onPress={() => {
                    setExpandedMonths((prev) => {
                      const next = new Set(prev);
                      if (next.has(monthGroup.key)) next.delete(monthGroup.key);
                      else next.add(monthGroup.key);
                      return next;
                    });
                  }}
                >
                  <Text style={styles.monthHeaderText}>{monthGroup.label}</Text>
                  <Text style={styles.monthHeaderChevron}>{isExpanded ? '▲' : '▼'}</Text>
                </Pressable>
                {isExpanded ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  >
                    {monthGroup.dates.map((date) => {
                      const dateStr = formatDate(date);
                      const selected = selectedDate === dateStr;
                      return (
                        <Pressable
                          key={dateStr}
                          onPress={() => setSelectedDate(dateStr)}
                          style={[styles.dateCard, selected && styles.cardSelected]}
                        >
                          <Text style={[styles.dateWeekday, selected && styles.selectedSubText]}>
                            {WEEKDAY_SHORT[date.getDay()]}
                          </Text>
                          <Text style={[styles.dateDay, selected && styles.selectedText]}>
                            {date.getDate()}
                          </Text>
                          <Text style={[styles.dateMonth, selected && styles.selectedSubText]}>
                            {MONTH_SHORT[date.getMonth()]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      {/* Time slot selection */}
      {selectedDate ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir un créneau</Text>
          {slotsLoading ? (
            <ActivityIndicator color="#2563eb" style={styles.loader} />
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
      ) : null}

      {/* Recap */}
      {canConfirm && selectedVehicleId !== null && selectedDate !== null && selectedSlot !== null ? (
        <View style={styles.recapSection}>
          <Text style={styles.recapTitle}>Récapitulatif</Text>
          <Text style={styles.recapLine}>
            {vehicles.find((v) => v.id === selectedVehicleId)?.brand}{' '}
            {vehicles.find((v) => v.id === selectedVehicleId)?.model}
          </Text>
          <Text style={styles.recapLine}>
            {selectedServiceNames.join(', ')}
          </Text>
          <Text style={styles.recapLine}>
            {selectedDate} à {selectedSlot}
          </Text>
          <Text style={styles.recapTotal}>{totalPrice} €</Text>
        </View>
      ) : null}

      {/* Error */}
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      {/* Confirm button */}
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
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 32,
    gap: 12,
  },

  // Garage header
  image: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  garageName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  garageCity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  garageAddress: {
    fontSize: 13,
    color: '#475569',
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyLabel: {
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: 13,
  },
  loader: {
    marginVertical: 8,
  },

  // Horizontal scroll
  horizontalList: {
    gap: 10,
    paddingVertical: 2,
  },

  // Shared selected states
  cardSelected: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  selectedText: {
    color: '#fff',
  },
  selectedSubText: {
    color: '#bfdbfe',
  },

  // Vehicle cards
  vehicleCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
    minWidth: 140,
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  vehicleSub: {
    fontSize: 12,
    color: '#475569',
  },
  vehiclePlate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // Service rows
  categoryBlock: {
    gap: 6,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  serviceRowSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  serviceName: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
  },
  serviceNameSelected: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    flexShrink: 0,
  },
  servicePriceSelected: {
    color: '#1d4ed8',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1d4ed8',
  },

  // Month accordion
  monthGroup: {
    gap: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monthHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  monthHeaderChevron: {
    fontSize: 10,
    color: '#64748b',
  },

  // Date cards
  dateCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    minWidth: 56,
  },
  dateWeekday: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateMonth: {
    fontSize: 11,
    color: '#64748b',
  },

  // Slot grid
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#f8fafc',
  },
  slotButtonSelected: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  // Recap
  recapSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    gap: 4,
  },
  recapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  recapLine: {
    fontSize: 13,
    color: '#1e40af',
  },
  recapTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1d4ed8',
    marginTop: 6,
  },

  // Error
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
  },

  // Confirm button
  confirmButton: {
    marginTop: 4,
    backgroundColor: '#1d4ed8',
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

  // Success screen
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
