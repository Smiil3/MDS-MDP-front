import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
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
    backgroundColor: '#2563eb',
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
    color: '#dc2626',
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepText: {
    color: '#64748b',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  backButtonPlaceholder: {
    width: 54,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#334155',
    marginTop: 4,
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
});
