export type AuthRole = 'driver' | 'mechanic';

export type User = {
  id: number;
  role: AuthRole;
  email: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSuccessResponse = AuthTokens & {
  user: User;
};

export type LoginPayload = {
  role: AuthRole;
  email: string;
  password: string;
};

export type DriverRegisterPayload = {
  role: 'driver';
  email: string;
  password: string;
  last_name: string;
  first_name: string;
  phone: string;
  birth_date: string;
  id_subscription: number;
};

export type MechanicOpeningHourSlot = {
  open: string;
  close: string;
};

export type MechanicOpeningHours = {
  mon: MechanicOpeningHourSlot[];
  tue: MechanicOpeningHourSlot[];
  wed: MechanicOpeningHourSlot[];
  thu: MechanicOpeningHourSlot[];
  fri: MechanicOpeningHourSlot[];
  sat: MechanicOpeningHourSlot[];
  sun: MechanicOpeningHourSlot[];
};

export type MechanicRegisterPayload = {
  role: 'mechanic';
  email: string;
  password: string;
  name: string;
  address: string;
  zip_code: number;
  city: string;
  description?: string;
  image_url?: string;
  opening_hours: MechanicOpeningHours;
  siret: string;
};

export type RegisterPayload = DriverRegisterPayload | MechanicRegisterPayload;
