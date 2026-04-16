export type AddressSuggestion = {
  label: string;
  address: string;
  zipCode: string;
  city: string;
};

export type AddressSuggestionsResponse = {
  suggestions: AddressSuggestion[];
};

export type CitiesResponse = {
  cities: string[];
};

export type GarageLookupResponse = {
  garage: {
    name: string;
    address: string;
    zipCode: string;
    city: string;
  };
  source: 'inpi' | 'sirene';
};
