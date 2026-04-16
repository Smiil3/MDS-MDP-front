import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../types/navigation';
import { authSharedStyles } from './onboarding/common';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingWelcome'>;

export function OnboardingWelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>
        Trouve le bon garage ou inscris ton garage en quelques étapes.
      </Text>

      <View style={styles.ctaStack}>
        <Pressable
          onPress={() => navigation.navigate('LoginRoleSelect')}
          style={authSharedStyles.primaryButton}
        >
          <Text style={authSharedStyles.primaryButtonText}>Se connecter</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('RegisterAccountType')}
          style={authSharedStyles.secondaryButton}
        >
          <Text style={authSharedStyles.secondaryButtonText}>S&apos;inscrire</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    maxWidth: 320,
  },
  ctaStack: {
    width: '100%',
    gap: 12,
  },
});
