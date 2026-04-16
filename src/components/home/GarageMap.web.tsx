import { createElement, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';

import { GarageCard } from '../../types/garage';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80';
const FRANCE_COORDS: [number, number] = [46.2276, 2.2137];

type MapMarkerPayload = {
  id: number;
  lat: number;
  lng: number;
  imageUrl: string;
};

type MapPayload = {
  center: [number, number];
  zoom: number;
  userCoords: { lat: number; lng: number } | null;
  markers: MapMarkerPayload[];
};

type GarageMapProps = {
  garages: GarageCard[];
  userCoords: { lat: number; lng: number } | null;
  selectedGarageId: number | null;
  onSelectGarage: (garage: GarageCard) => void;
  onMapPress?: () => void;
};

type MapInboundEvent =
  | { type: 'mapPress' }
  | { type: 'selectGarage'; garageId: number };

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

const buildMapHtml = (payload: MapPayload) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f1f5f9; }
      .garage-pin {
        width: 44px;
        height: 44px;
        border-radius: 9999px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid #fff;
      }
      .garage-pin.selected {
        border-color: #2563eb;
        border-width: 3px;
      }
      .garage-pin img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const payload = ${JSON.stringify(payload)};
      const post = (message) => {
        window.parent.postMessage(JSON.stringify(message), '*');
      };

      const map = L.map('map', { zoomControl: true }).setView(payload.center, payload.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      map.on('click', () => post({ type: 'mapPress' }));
      const markersById = new Map();
      let selectedMarkerId = null;

      const createMarkerIcon = (imageUrl, selected) => {
        const pinClass = selected ? 'garage-pin selected' : 'garage-pin';
        return L.divIcon({
          className: '',
          html: '<div class="' + pinClass + '"><img src="' + imageUrl + '" alt="garage" /></div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
      };

      const setSelectedMarker = (garageId) => {
        if (selectedMarkerId !== null) {
          const previous = markersById.get(selectedMarkerId);
          if (previous) {
            previous.marker.setIcon(createMarkerIcon(previous.imageUrl, false));
          }
        }

        selectedMarkerId = null;

        if (garageId === null || garageId === undefined) {
          return;
        }

        const current = markersById.get(garageId);
        if (!current) {
          return;
        }

        current.marker.setIcon(createMarkerIcon(current.imageUrl, true));
        selectedMarkerId = garageId;
      };

      const focusGarage = (garageId) => {
        const target = markersById.get(garageId);
        if (!target) {
          return;
        }
        map.flyTo(target.marker.getLatLng(), Math.max(map.getZoom(), 14), { animate: true, duration: 0.35 });
        setSelectedMarker(garageId);
      };

      window.addEventListener('message', (event) => {
        try {
          const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (message.type === 'focusGarage') {
            focusGarage(message.garageId);
          } else if (message.type === 'clearGarageSelection') {
            setSelectedMarker(null);
          }
        } catch (error) {
          console.error(error);
        }
      });

      if (payload.userCoords) {
        L.circleMarker([payload.userCoords.lat, payload.userCoords.lng], {
          radius: 8,
          color: '#1d4ed8',
          fillColor: '#3b82f6',
          fillOpacity: 0.95,
          weight: 2
        }).addTo(map);
      }

      payload.markers.forEach((marker) => {
        const icon = createMarkerIcon(marker.imageUrl, false);
        const leafletMarker = L.marker([marker.lat, marker.lng], { icon }).addTo(map);
        markersById.set(marker.id, { marker: leafletMarker, imageUrl: marker.imageUrl });
        leafletMarker.on('click', () => {
          focusGarage(marker.id);
          post({ type: 'selectGarage', garageId: marker.id });
        });
      });
    </script>
  </body>
</html>`;

export function GarageMap({
  garages,
  userCoords,
  selectedGarageId,
  onSelectGarage,
  onMapPress,
}: GarageMapProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const garagesById = useMemo(() => new Map(garages.map((garage) => [garage.id, garage])), [garages]);
  const payload = useMemo<MapPayload>(() => {
    const center = resolveCenter(garages, userCoords);
    const markers = garages.flatMap((garage): MapMarkerPayload[] => {
      if (typeof garage.latitude !== 'number' || typeof garage.longitude !== 'number') {
        return [];
      }

      return [
        {
          id: garage.id,
          lat: garage.latitude,
          lng: garage.longitude,
          imageUrl: garage.imageUrl ?? PLACEHOLDER_IMAGE,
        },
      ];
    });

    return {
      center,
      zoom: userCoords ? 13 : 6,
      userCoords,
      markers,
    };
  }, [garages, userCoords]);

  const syncSelectedGarage = () => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) {
      return;
    }

    if (selectedGarageId === null) {
      targetWindow.postMessage(JSON.stringify({ type: 'clearGarageSelection' }), '*');
      return;
    }

    targetWindow.postMessage(
      JSON.stringify({
        type: 'focusGarage',
        garageId: selectedGarageId,
      }),
      '*',
    );
  };

  useEffect(() => {
    syncSelectedGarage();
  }, [selectedGarageId]);

  useEffect(() => {
    const onWindowMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (typeof event.data !== 'string') {
        return;
      }

      try {
        const message = JSON.parse(event.data) as MapInboundEvent;
        if (message.type === 'mapPress') {
          onMapPress?.();
          return;
        }

        if (message.type === 'selectGarage') {
          const garage = garagesById.get(message.garageId);
          if (garage) {
            onSelectGarage(garage);
          }
        }
      } catch {
        // Ignore non-JSON events from iframe internals.
      }
    };

    window.addEventListener('message', onWindowMessage);
    return () => {
      window.removeEventListener('message', onWindowMessage);
    };
  }, [garagesById, onMapPress, onSelectGarage]);

  return (
    <View style={styles.container}>
      {createElement('iframe', {
        ref: (node: HTMLIFrameElement | null) => {
          iframeRef.current = node;
        },
        title: 'garages-map',
        srcDoc: buildMapHtml(payload),
        style: iframeStyle,
        sandbox: 'allow-scripts allow-same-origin',
        onLoad: syncSelectedGarage,
      })}
    </View>
  );
}

const iframeStyle: CSSProperties = {
  border: '0',
  width: '100%',
  height: '100%',
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
