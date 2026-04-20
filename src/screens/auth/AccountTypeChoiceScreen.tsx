import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthOnboarding } from '../../context/auth/AuthOnboardingContext';
import { AuthRole } from '../../types/auth';
import { AuthStackParamList } from '../../types/navigation';
import { authSharedStyles, WizardScreenLayout } from './onboarding/common';

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'LoginRoleSelect'>;

export function LoginRoleSelectScreen({ navigation }: LoginProps) {
  const onSelectRole = (role: AuthRole) => {
    navigation.navigate('Login', { role });
  };

  return (
    <View style={loginStyles.container}>
      <Image source={require('../../../assets/images/logo-mecanoo.png')} style={loginStyles.logo} resizeMode="contain" />
      <Text style={loginStyles.title}>Connexion</Text>
      <Text style={loginStyles.subtitle}>Choisis ton type de compte pour continuer.</Text>
      <View style={loginStyles.ctaRow}>
        <Pressable onPress={() => onSelectRole('driver')} style={loginStyles.roleCard}>
          <Image source={require('../../../assets/images/driver.jpg')} style={loginStyles.roleImage} resizeMode="cover" />
          <View style={loginStyles.roleDimmer} />
          <View style={loginStyles.roleContent}>
            <Image source={require('../../../assets/images/user.png')} style={loginStyles.roleLogo} resizeMode="contain" />
            <Text style={loginStyles.roleLabel}>Particulier</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => onSelectRole('mechanic')} style={loginStyles.roleCard}>
          <Image source={require('../../../assets/images/mechanic.jpg')} style={loginStyles.roleImage} resizeMode="cover" />
          <View style={loginStyles.roleDimmer} />
          <View style={loginStyles.roleContent}>
            <Image source={require('../../../assets/images/screwdriver.png')} style={loginStyles.roleLogo} resizeMode="contain" />
            <Text style={loginStyles.roleLabel}>Garagiste</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B3E5FF',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
  },
  subtitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 32,
    maxWidth: 320,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  roleImage: {
    width: '100%',
    height: 160,
  },
  roleDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  roleContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  roleLogo: {
    width: 80,
    height: 40,
  },
  roleLabel: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});

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
