import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ComponentProps, PropsWithChildren } from 'react';

type WizardProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  stepLabel?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
}>;

export function WizardScreenLayout({
  title,
  subtitle,
  stepLabel,
  canGoBack,
  onGoBack,
  children,
}: WizardProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {canGoBack ? (
          <Pressable onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        {stepLabel ? <Text style={styles.stepText}>{stepLabel}</Text> : null}
      </View>

      <View style={styles.centered}>
        <Image source={require('../../../../assets/images/logo-mecanoo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

type LabeledInputProps = {
  label: string;
} & ComponentProps<typeof TextInput>;

export function LabeledInput({ label, style, ...props }: LabeledInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, style]} />
    </View>
  );
}

export const authSharedStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#2D3F8C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  errorText: {
    color: '#7f1d1d',
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    backgroundColor: '#B3E5FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepText: {
    color: '#fff',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  backButtonPlaceholder: {
    width: 54,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  content: {
    width: '100%',
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
});
