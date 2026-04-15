export type OpeningHoursRange = {
  open: string;
  close: string;
};

export type OpeningHoursSlots = OpeningHoursRange[];

export type OpeningHoursClosed = {
  closed: true;
};

export type OpeningHours = Record<
  string,
  OpeningHoursRange | OpeningHoursClosed | OpeningHoursSlots
>;

export type GarageCard = {
  id: number;
  name: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  openingHours: OpeningHours | null;
  description: string | null;
  distanceMeters: number | null;
};

export type NearbyGaragesResponse = {
  garages: GarageCard[];
};
