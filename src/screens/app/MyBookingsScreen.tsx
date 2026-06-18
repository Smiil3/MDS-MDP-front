import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getMyBookings, MyBooking } from '../../services/api/bookingApi';

const ADDRESS_ICON = require('../../../assets/images/address.png');

function formatAppointmentDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatAppointmentTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_TEXT_COLORS: Record<string, string> = {
  'en attente': '#ca8a04',
  'confirmee':    '#19ba54',
  'annulee':    '#dc2626',
  'terminee':   '#045118',
};

function statusColor(label: string): string {
  const key = label.toLowerCase();
  return STATUS_TEXT_COLORS[key] ?? '#1a3fa6';
}

export function MyBookingsScreen() {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMyBookings()
      .then((data) => {
        if (isMounted) setBookings(data);
      })
      .catch(() => {
        if (isMounted) setErrorMessage('Impossible de charger les réservations.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/logo-mecanoo.png')}
          style={styles.headerLogo}
        />
        <Text style={styles.title}>Mes réservations</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={
            bookings.length === 0 ? styles.emptyContainer : styles.listContent
          }
          data={bookings}
          keyExtractor={(item) => String(item.id_booking)}
          ListEmptyComponent={
            errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text style={styles.emptyText}>Aucune réservation pour le moment.</Text>
            )
          }
          renderItem={({ item }) => {
            return (
              <View style={styles.card}>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{item.mechanic.name}</Text>
                    <Text style={[styles.statusText, { color: statusColor(item.booking_status.label) }]}>
                      {item.booking_status.label}
                    </Text>
                  </View>

                  <View style={styles.cardInfoRow}>
                    {ADDRESS_ICON ? (
                      <Image source={ADDRESS_ICON} style={styles.cardRowIcon} />
                    ) : null}
                    <Text style={styles.cardAddress}>{item.mechanic.address}</Text>
                  </View>

                  {/* Téléphone */}
                  {item.mechanic.phone ? (
                    <View style={styles.cardInfoRow}>
                      {ADDRESS_ICON ? (
                        <Image source={ADDRESS_ICON} style={styles.cardRowIcon} />
                      ) : null}
                      <Text style={styles.cardAddress}>{item.mechanic.phone}</Text>
                    </View>
                  ) : null}

                  <View style={styles.appointmentBlock}>
                    <Text style={styles.appointmentDate}>
                      {formatAppointmentDate(item.appointment_date)}
                    </Text>
                    <View style={styles.appointmentBottomRow}>
                      <Text style={styles.appointmentTime}>
                        {formatAppointmentTime(item.appointment_date)}
                      </Text>
                      <Text style={styles.cardVehicle}>
                        {item.vehicle.brand} {item.vehicle.model}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.servicesAmountRow}>
                    <View style={styles.cardServices}>
                      {item.booking_garage_service.map((bgs) => (
                        <View
                          key={bgs.garage_service.id_garage_service}
                          style={styles.serviceTag}
                        >
                          <Text style={styles.serviceTagText}>
                            {bgs.garage_service.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.cardAmount}>{item.total_amount} €</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable style={styles.btnEdit}>
                      <Text style={styles.btnEditText}>Modifier</Text>
                    </Pressable>
                    <Pressable style={styles.btnDelete}>
                      <Text style={styles.btnDeleteText}>Supprimer</Text>
                    </Pressable>
                  </View>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3fa6',
    marginTop: 10,
    alignSelf: 'stretch',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '#334155',
    fontSize: 15,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.025,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardBody: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  appointmentBlock: {
    marginTop: 6,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f0f6ff',
    borderRadius: 10,
  },
  appointmentDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3fa6',
    textTransform: 'capitalize',
  },
  appointmentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  appointmentTime: {
    fontSize: 20,
    fontWeight: '800',
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
  },
  cardVehicle: {
    fontSize: 13,
    color: '#475569',
  },
  servicesAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  cardServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  serviceTag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#475569',
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
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
});
