import { apiGet } from './httpClient';
import {
  AddressSuggestionsResponse,
  CitiesResponse,
  GarageLookupResponse,
} from '../../types/location';

export function getAddressSuggestions(query: string): Promise<AddressSuggestionsResponse> {
  const params = new URLSearchParams({ query });
  return apiGet<AddressSuggestionsResponse>(`/api/location/address-suggestions?${params.toString()}`);
}

export function getCitiesByPostalCode(postalCode: string): Promise<CitiesResponse> {
  const params = new URLSearchParams({ postalCode });
  return apiGet<CitiesResponse>(`/api/location/cities?${params.toString()}`);
}

export function lookupGarageBySiret(siret: string): Promise<GarageLookupResponse> {
  return apiGet<GarageLookupResponse>(`/api/location/siret/${siret}`);
}
