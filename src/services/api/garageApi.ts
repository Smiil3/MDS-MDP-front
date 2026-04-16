import { apiGet } from './httpClient';
import { GarageCard, GarageDetailsResponse, NearbyGaragesResponse } from '../../types/garage';

type GetNearbyGaragesParams = {
  lat?: number;
  lng?: number;
  search?: string;
  limit?: number;
};

export const CARDS_VIEW_LIMIT = 5;
export const MAP_VIEW_LIMIT = 20;

export async function getNearbyGarages(
  params: GetNearbyGaragesParams = {},
): Promise<NearbyGaragesResponse> {
  const query = new URLSearchParams();

  if (typeof params.lat === 'number' && typeof params.lng === 'number') {
    query.set('lat', String(params.lat));
    query.set('lng', String(params.lng));
  }

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  query.set('limit', String(params.limit ?? CARDS_VIEW_LIMIT));

  const path = `/api/garages/nearby?${query.toString()}`;
  return apiGet<NearbyGaragesResponse>(path);
}

export async function getGarageDetails(garageId: number): Promise<GarageCard> {
  const response = await apiGet<GarageDetailsResponse>(`/api/garages/${garageId}`);
  return 'garage' in response ? response.garage : response;
}
