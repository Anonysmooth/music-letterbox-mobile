import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { AlbumStatus } from '../types';

interface StatusSelectorProps {
  currentStatus: AlbumStatus | null;
  onStatusChange: (status: AlbumStatus | null) => void;
}

interface StatusOption {
  status: AlbumStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const statusOptions: StatusOption[] = [
  { status: 'favorite', label: 'Favori', icon: 'heart', color: colors.favorite },
  { status: 'wishlist', label: 'À écouter', icon: 'bookmark', color: colors.wishlist },
  { status: 'listened', label: 'Écouté', icon: 'checkmark-circle', color: colors.listened },
];

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statut</Text>
      <View style={styles.options}>
        {statusOptions.map((option) => {
          const isSelected = currentStatus === option.status;
          return (
            <TouchableOpacity
              key={option.status}
              style={[
                styles.option,
                isSelected && { backgroundColor: option.color, borderColor: option.color },
              ]}
              onPress={() => onStatusChange(isSelected ? null : option.status)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={isSelected ? colors.white : option.color}
              />
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    color: colors.textLight,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  optionLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.white,
  },
});
