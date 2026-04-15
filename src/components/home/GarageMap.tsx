import { Image, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import { GarageCard } from '../../types/garage';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';
const FRANCE_COORDS = { latitude: 46.2276, longitude: 2.2137 };
const DEFAULT_DELTA = { latitudeDelta: 2.8, longitudeDelta: 2.8 };

type GarageMapProps = {
  garages: GarageCard[];
  userCoords: { lat: number; lng: number } | null;
  selectedGarageId: number | null;
  onSelectGarage: (garage: GarageCard) => void;
  onMapPress?: () => void;
};

const resolveCenter = (garages: GarageCard[], userCoords: GarageMapProps['userCoords']) => {
  if (userCoords) {
    return { latitude: userCoords.lat, longitude: userCoords.lng };
  }

  const firstWithCoords = garages.find(
    (garage) => typeof garage.latitude === 'number' && typeof garage.longitude === 'number',
  );
  if (firstWithCoords) {
    return {
      latitude: firstWithCoords.latitude as number,
      longitude: firstWithCoords.longitude as number,
    };
  }

  return FRANCE_COORDS;
};

export function GarageMap({
  garages,
  userCoords,
  selectedGarageId,
  onSelectGarage,
  onMapPress,
}: GarageMapProps) {
  const center = resolveCenter(garages, userCoords);

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      mapType="none"
      initialRegion={{
        ...center,
        ...DEFAULT_DELTA,
      }}
      showsUserLocation={Boolean(userCoords)}
      onPress={onMapPress}
    >
      <UrlTile
        maximumZ={19}
        flipY={false}
        urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {garages.map((garage) => {
        if (typeof garage.latitude !== 'number' || typeof garage.longitude !== 'number') {
          return null;
        }

        const isSelected = selectedGarageId === garage.id;
        return (
          <Marker
            key={garage.id}
            coordinate={{ latitude: garage.latitude, longitude: garage.longitude }}
            onPress={() => onSelectGarage(garage)}
          >
            <Pressable>
              <View style={[styles.markerFrame, isSelected ? styles.markerSelected : null]}>
                <Image
                  source={{ uri: garage.imageUrl ?? PLACEHOLDER_IMAGE }}
                  style={styles.markerImage}
                />
              </View>
            </Pressable>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  markerSelected: {
    borderColor: '#2563eb',
    borderWidth: 3,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
});
