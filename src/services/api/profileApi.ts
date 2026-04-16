import { apiGet, apiPatch, apiPost } from './httpClient';
import {
  CreateDriverVehiclePayload,
  DriverProfile,
  DriverVehicle,
  UpdateDriverProfilePayload,
} from '../../types/profile';

type DriverProfileResponse = {
  profile: DriverProfile;
};

type DriverVehiclesResponse = {
  vehicles: DriverVehicle[];
};

type DriverVehicleResponse = {
  vehicle: DriverVehicle;
};

export async function getMyProfile(): Promise<DriverProfile> {
  const response = await apiGet<DriverProfileResponse>('/api/users/me');
  return response.profile;
}

export async function updateMyProfile(
  payload: UpdateDriverProfilePayload,
): Promise<DriverProfile> {
  const response = await apiPatch<DriverProfileResponse, UpdateDriverProfilePayload>(
    '/api/users/me',
    payload,
  );
  return response.profile;
}

export async function getMyVehicles(): Promise<DriverVehicle[]> {
  const response = await apiGet<DriverVehiclesResponse>('/api/users/me/vehicles');
  return response.vehicles;
}

export async function createMyVehicle(
  payload: CreateDriverVehiclePayload,
): Promise<DriverVehicle> {
  const response = await apiPost<DriverVehicleResponse, CreateDriverVehiclePayload>(
    '/api/users/me/vehicles',
    payload,
  );
  return response.vehicle;
}
