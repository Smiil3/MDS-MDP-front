import { apiGet } from './httpClient';
import { NearbyGaragesResponse } from '../../types/garage';

type GetNearbyGaragesParams = {
  lat?: number;
  lng?: number;
  search?: string;
  limit?: number;
};

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

  query.set('limit', String(params.limit ?? 5));

  const path = `/api/garages/nearby?${query.toString()}`;
  return apiGet<NearbyGaragesResponse>(path);
}
