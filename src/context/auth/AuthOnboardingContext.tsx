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

const createDraftId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export type GaragePrestationDraft = {
  id: string;
  serviceName: string;
  price: string;
};

export type GarageServiceDraft = {
  id: string;
  category: string;
  prestations: GaragePrestationDraft[];
};

type GarageDraft = {
  siret: string;
  name: string;
  imageUrl: string;
  description: string;
  address: string;
  zipCode: string;
  city: string;
  services: GarageServiceDraft[];
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

const createGaragePrestationDraft = (): GaragePrestationDraft => ({
  id: createDraftId(),
  serviceName: '',
  price: '',
});

const createGarageServiceDraft = (): GarageServiceDraft => ({
  id: createDraftId(),
  category: '',
  prestations: [createGaragePrestationDraft()],
});

const createGarageDraft = (): GarageDraft => ({
  siret: '',
  name: '',
  imageUrl: '',
  description: '',
  address: '',
  zipCode: '',
  city: '',
  services: [createGarageServiceDraft()],
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
        const grouped = new Map<string, { serviceName: string; price: number }[]>();
        for (const serviceCategory of garage.services) {
          const category = serviceCategory.category.trim();
          if (!category) {
            continue;
          }
          for (const prestation of serviceCategory.prestations) {
            const serviceName = prestation.serviceName.trim();
            const price = Number(prestation.price);
            if (!serviceName || !Number.isFinite(price) || price <= 0) {
              continue;
            }
            const current = grouped.get(category) ?? [];
            current.push({ serviceName, price });
            grouped.set(category, current);
          }
        }
        return Array.from(grouped.entries()).map(([category, services]) => ({
          [category]: services,
        }));
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
