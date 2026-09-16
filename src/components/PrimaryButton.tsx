import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled} accessibilityState={{disabled:disabled}}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.sageDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.88 },
  label: { color: colors.onAccent, fontSize: 17, fontWeight: '700' },
});
