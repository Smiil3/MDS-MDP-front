export type DriverProfile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  image_url: string | null;
};

export type DriverVehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  engine: string;
  license_plate: string | null;
  fuel_type: string | null;
  mileage: number;
};

export type UpdateDriverProfilePayload = Partial<
  Pick<
    DriverProfile,
    'first_name' | 'last_name' | 'phone' | 'email' | 'birth_date' | 'image_url'
  >
>;

export type CreateDriverVehiclePayload = {
  brand: string;
  model: string;
  year: number;
  engine: string;
  license_plate: string;
  mileage: number;
  fuel_type?: string;
};
