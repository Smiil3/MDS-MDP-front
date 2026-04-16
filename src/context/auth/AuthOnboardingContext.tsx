import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { AuthRole, MechanicOpeningHours, MechanicServiceCategory } from '../../types/auth';

type DriverDraft = {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
};

type GarageDraft = {
  siret: string;
  name: string;
  imageUrl: string;
  description: string;
  address: string;
  zipCode: string;
  city: string;
  serviceCategory: string;
  serviceName: string;
  servicePrice: string;
  openingHours: MechanicOpeningHours;
  email: string;
  password: string;
  passwordConfirmation: string;
};

type AuthOnboardingContextValue = {
  selectedAccountType: AuthRole | null;
  setSelectedAccountType: (value: AuthRole | null) => void;
  driver: DriverDraft;
  setDriver: (value: Partial<DriverDraft>) => void;
  garage: GarageDraft;
  setGarage: (value: Partial<GarageDraft>) => void;
  resetDriver: () => void;
  resetGarage: () => void;
  toGarageServicesPayload: () => MechanicServiceCategory[];
};

const createDefaultOpeningHours = (): MechanicOpeningHours => ({
  mon: [{ open: '08:00', close: '18:00' }],
  tue: [{ open: '08:00', close: '18:00' }],
  wed: [{ open: '08:00', close: '18:00' }],
  thu: [{ open: '08:00', close: '18:00' }],
  fri: [{ open: '08:00', close: '18:00' }],
  sat: [],
  sun: [],
});

const createDriverDraft = (): DriverDraft => ({
  email: '',
  password: '',
  passwordConfirmation: '',
  firstName: '',
  lastName: '',
  phone: '',
  birthDate: '',
});

const createGarageDraft = (): GarageDraft => ({
  siret: '',
  name: '',
  imageUrl: '',
  description: '',
  address: '',
  zipCode: '',
  city: '',
  serviceCategory: '',
  serviceName: '',
  servicePrice: '',
  openingHours: createDefaultOpeningHours(),
  email: '',
  password: '',
  passwordConfirmation: '',
});

const AuthOnboardingContext = createContext<AuthOnboardingContextValue | undefined>(undefined);

export function AuthOnboardingProvider({ children }: PropsWithChildren) {
  const [selectedAccountType, setSelectedAccountType] = useState<AuthRole | null>(null);
  const [driver, setDriverState] = useState<DriverDraft>(createDriverDraft);
  const [garage, setGarageState] = useState<GarageDraft>(createGarageDraft);

  const value = useMemo<AuthOnboardingContextValue>(
    () => ({
      selectedAccountType,
      setSelectedAccountType,
      driver,
      setDriver: (next) => {
        setDriverState((previous) => ({ ...previous, ...next }));
      },
      garage,
      setGarage: (next) => {
        setGarageState((previous) => ({ ...previous, ...next }));
      },
      resetDriver: () => setDriverState(createDriverDraft()),
      resetGarage: () => setGarageState(createGarageDraft()),
      toGarageServicesPayload: () => {
        const category = garage.serviceCategory.trim();
        const serviceName = garage.serviceName.trim();
        const price = Number(garage.servicePrice);
        if (!category || !serviceName || !Number.isFinite(price) || price <= 0) {
          return [];
        }
        return [
          {
            [category]: [{ serviceName, price }],
          },
        ];
      },
    }),
    [selectedAccountType, driver, garage],
  );

  return <AuthOnboardingContext.Provider value={value}>{children}</AuthOnboardingContext.Provider>;
}

export function useAuthOnboarding(): AuthOnboardingContextValue {
  const context = useContext(AuthOnboardingContext);
  if (!context) {
    throw new Error('useAuthOnboarding must be used within AuthOnboardingProvider');
  }
  return context;
}
