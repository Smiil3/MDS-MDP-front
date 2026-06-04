import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GarageCard } from '../../types/garage';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';

const ADDRESS_ICON = require('../../../assets/images/address.png');
const DISTANCE_ICON = require('../../../assets/images/navigation.png');

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

const formatDistance = (distanceMeters: number | null) => {
  if (distanceMeters === null) return null;
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

const getCategoryNames = (services: GarageCard['services'], max = 3): string[] => {
  if (!services) return [];
  const names: string[] = [];
  for (const category of services) {
    for (const key of Object.keys(category)) {
      names.push(key);
      if (names.length >= max) return names;
    }
  }
  return names;
};

type Props = {
  item: GarageCard;
  onPress?: () => void;
};

export function GarageCardItem({ item, onPress }: Props) {
  const distanceLabel = formatDistance(item.distanceMeters);
  const categoryNames = getCategoryNames(item.services);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}
    >
      <Image source={{ uri: item.imageUrl ?? PLACEHOLDER_IMAGE }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.averageRating != null ? (
            <View style={styles.cardRatingRow}>
              {renderStars(item.averageRating, 14)}
              <Text style={styles.cardRating}>{item.averageRating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardInfoRow}>
          {ADDRESS_ICON ? <Image source={ADDRESS_ICON} style={styles.cardRowIcon} /> : null}
          <Text style={styles.cardAddress}>{item.address}</Text>
        </View>
        {distanceLabel ? (
          <View style={styles.cardInfoRow}>
            {DISTANCE_ICON ? <Image source={DISTANCE_ICON} style={styles.cardRowIcon} /> : null}
            <Text style={styles.cardDistance}>À {distanceLabel} de vous</Text>
          </View>
        ) : null}
        {categoryNames.length > 0 ? (
          <View style={styles.cardServices}>
            {categoryNames.map((name) => (
              <View key={name} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{name}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.025,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardImage: {
    width: '100%',
    height: 160,
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
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
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
  },
  cardDistance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a3fa6',
  },
  cardServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
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
});