import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Overlay } from 'pigeon-maps';
import { osm } from 'pigeon-maps/providers';

import { GarageCard } from '../../types/garage';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';
const FRANCE_COORDS: [number, number] = [46.2276, 2.2137];

type GarageMapProps = {
  garages: GarageCard[];
  userCoords: { lat: number; lng: number } | null;
  selectedGarageId: number | null;
  onSelectGarage: (garage: GarageCard) => void;
  onMapPress?: () => void;
};

const resolveCenter = (garages: GarageCard[], userCoords: GarageMapProps['userCoords']) => {
  if (userCoords) {
    return [userCoords.lat, userCoords.lng] as [number, number];
  }

  const firstWithCoords = garages.find(
    (garage) => typeof garage.latitude === 'number' && typeof garage.longitude === 'number',
  );
  if (firstWithCoords) {
    return [firstWithCoords.latitude as number, firstWithCoords.longitude as number] as [number, number];
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
  const center = useMemo(() => resolveCenter(garages, userCoords), [garages, userCoords]);

  return (
    <View style={styles.mapRoot}>
      <Map
        center={center}
        zoom={userCoords ? 13 : 6}
        provider={osm}
        twoFingerDrag={false}
        height={700}
        onClick={() => onMapPress?.()}
      >
        {userCoords ? (
          <Overlay anchor={[userCoords.lat, userCoords.lng]} offset={[8, 8]}>
            <div style={stylesWeb.userDot} />
          </Overlay>
        ) : null}

        {garages.map((garage) => {
          if (typeof garage.latitude !== 'number' || typeof garage.longitude !== 'number') {
            return null;
          }

          const isSelected = selectedGarageId === garage.id;
          return (
            <Overlay key={garage.id} anchor={[garage.latitude, garage.longitude]} offset={[22, 22]}>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectGarage(garage);
                }}
                style={stylesWeb.pinButton}
                type="button"
              >
                <img
                  alt={garage.name}
                  src={garage.imageUrl ?? PLACEHOLDER_IMAGE}
                  style={{
                    ...stylesWeb.pinImage,
                    borderColor: isSelected ? '#2563eb' : '#ffffff',
                    borderWidth: isSelected ? '3px' : '2px',
                  }}
                />
              </button>
            </Overlay>
          );
        })}
      </Map>
    </View>
  );
}

const stylesWeb: Record<string, CSSProperties> = {
  pinButton: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  pinImage: {
    width: '44px',
    height: '44px',
    borderRadius: '9999px',
    objectFit: 'cover',
    boxShadow: '0 2px 8px rgba(0,0,0,.3)',
    display: 'block',
    borderStyle: 'solid',
  },
  userDot: {
    width: '16px',
    height: '16px',
    borderRadius: '9999px',
    backgroundColor: '#3b82f6',
    border: '2px solid #1d4ed8',
    boxShadow: '0 0 0 4px rgba(59,130,246,.2)',
  },
};

const styles = StyleSheet.create({
  mapRoot: {
    ...StyleSheet.absoluteFillObject,
  },
});
