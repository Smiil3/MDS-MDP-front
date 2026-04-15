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

export type MechanicRegisterPayload = {
  role: 'mechanic';
  email: string;
  password: string;
  name: string;
  address: string;
  zip_code: number;
  city: string;
  description?: string;
  siret: string;
};

export type RegisterPayload = DriverRegisterPayload | MechanicRegisterPayload;
