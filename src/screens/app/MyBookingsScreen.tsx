import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getMyBookings, MyBooking } from '../../services/api/bookingApi';
import { AccountStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AccountStackParamList, 'MyBookings'>;

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MyBookingsScreen(_: Props) {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMyBookings()
      .then((data) => {
        if (isMounted) {
          setBookings(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage('Impossible de charger les réservations.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Aucune réservation pour le moment.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={bookings}
      keyExtractor={(item) => String(item.id_booking)}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.garageName}>{item.mechanic.name}</Text>
            <Text style={styles.status}>{item.booking_status.label}</Text>
          </View>
          <Text style={styles.city}>{item.mechanic.city}</Text>
          <Text style={styles.date}>{formatDate(item.appointment_date)}</Text>
          <Text style={styles.vehicle}>
            {item.vehicle.brand} {item.vehicle.model}
          </Text>
          <View style={styles.services}>
            {item.booking_garage_service.map((bgs) => (
              <Text key={bgs.garage_service.id_garage_service} style={styles.serviceItem}>
                • {bgs.garage_service.label}
              </Text>
            ))}
          </View>
          <Text style={styles.amount}>{item.total_amount} €</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  emptyText: {
    color: '#475569',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  garageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  status: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  city: {
    fontSize: 13,
    color: '#475569',
  },
  date: {
    fontSize: 14,
    color: '#334155',
  },
  vehicle: {
    fontSize: 14,
    color: '#334155',
  },
  services: {
    gap: 2,
  },
  serviceItem: {
    fontSize: 13,
    color: '#475569',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
});
