import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../types/navigation';
import { authSharedStyles } from './onboarding/common';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingWelcome'>;

export function OnboardingWelcomeScreen({ navigation }: Props) {
  return (
    <ImageBackground
      source={require('../../../assets/images/login.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Image source={require('../../../assets/images/logo-mecanoo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Mecanoo</Text>
        <Text style={styles.subtitle}>Trouve le garage de confiance le plus proche de chez toi.</Text>

        <View style={styles.ctaStack}>
          <Pressable
            onPress={() => navigation.navigate('LoginRoleSelect')}
            style={[authSharedStyles.primaryButton, styles.loginButton]}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(179, 229, 255, 0.80)',
  },
  container: {
    flex: 1,
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
    marginBottom: 24,
    maxWidth: 320,
  },
  ctaStack: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#2D3F8C',
  },
});
