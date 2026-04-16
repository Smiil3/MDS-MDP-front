import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';

import { useAuthOnboarding } from '../../context/auth/AuthOnboardingContext';
import { AuthRole } from '../../types/auth';
import { AuthStackParamList } from '../../types/navigation';
import { authSharedStyles, WizardScreenLayout } from './onboarding/common';

function RoleChoice({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} style={authSharedStyles.secondaryButton}>
      <Text style={authSharedStyles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'LoginRoleSelect'>;

export function LoginRoleSelectScreen({ navigation }: LoginProps) {
  const onSelectRole = (role: AuthRole) => {
    navigation.navigate('Login', { role });
  };

  return (
    <WizardScreenLayout
      title="Connexion"
      subtitle="Choisis ton type de compte pour continuer."
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <RoleChoice onPress={() => onSelectRole('driver')} label="Particulier" />
      <RoleChoice onPress={() => onSelectRole('mechanic')} label="Garage" />
    </WizardScreenLayout>
  );
}

type RegisterProps = NativeStackScreenProps<AuthStackParamList, 'RegisterAccountType'>;

export function RegisterAccountTypeScreen({ navigation }: RegisterProps) {
  const { setSelectedAccountType, resetDriver, resetGarage } = useAuthOnboarding();

  const onSelectDriver = () => {
    setSelectedAccountType('driver');
    resetDriver();
    navigation.navigate('RegisterDriverEmail');
  };

  const onSelectGarage = () => {
    setSelectedAccountType('mechanic');
    resetGarage();
    navigation.navigate('RegisterGarageInfo');
  };

  return (
    <WizardScreenLayout
      title="Création de compte"
      subtitle="Tu t&apos;inscris en tant que particulier ou garage ?"
      canGoBack
      onGoBack={() => navigation.goBack()}
    >
      <RoleChoice onPress={onSelectDriver} label="Particulier" />
      <RoleChoice onPress={onSelectGarage} label="Garage" />
    </WizardScreenLayout>
  );
}
