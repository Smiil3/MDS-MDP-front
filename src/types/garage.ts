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

export type GarageService = {
  id: number;
  serviceName: string;
  price: number;
};

export type GarageServiceCategory = Record<string, GarageService[]>;
export type GarageServices = GarageServiceCategory[];

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
  services: GarageServices | null;
  distanceMeters: number | null;
};

export type NearbyGaragesResponse = {
  garages: GarageCard[];
};

export type GarageDetailsResponse =
  | GarageCard
  | {
      garage: GarageCard;
    };

export type GarageReview = {
  id_review: number;
  rating: number;
  description: string;
  date: string;
  driver: {
    first_name: string;
    last_name: string;
  };
};

export type GarageReviewsResponse = {
  reviews: GarageReview[];
  total: number;
  average: number;
  page: number;
  totalPages: number;
};
