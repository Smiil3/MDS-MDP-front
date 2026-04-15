export type OpeningHoursRange = {
  open: string;
  close: string;
};

export type OpeningHoursClosed = {
  closed: true;
};

export type OpeningHours = Record<string, OpeningHoursRange | OpeningHoursClosed>;

export type GarageCard = {
  id: number;
  name: string;
  city: string;
  address: string;
  imageUrl: string | null;
  openingHours: OpeningHours | null;
  description: string | null;
  distanceMeters: number | null;
};

export type NearbyGaragesResponse = {
  garages: GarageCard[];
};
