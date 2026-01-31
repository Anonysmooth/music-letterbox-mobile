import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  readonly?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 24,
  readonly = false,
  onRatingChange,
}) => {
  const handlePress = (index: number) => {
    if (!readonly && onRatingChange) {
      // If clicking the same star, toggle between full and half
      const newRating = index + 1;
      if (Math.ceil(rating) === newRating && rating % 1 === 0) {
        onRatingChange(newRating - 0.5);
      } else if (rating === newRating - 0.5) {
        onRatingChange(0);
      } else {
        onRatingChange(newRating);
      }
    }
  };

  const renderStar = (index: number) => {
    const filled = rating >= index + 1;
    const halfFilled = rating > index && rating < index + 1;

    let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
    if (filled) {
      iconName = 'star';
    } else if (halfFilled) {
      iconName = 'star-half';
    }

    const star = (
      <Ionicons
        name={iconName}
        size={size}
        color={filled || halfFilled ? colors.orange : colors.border}
      />
    );

    if (readonly) {
      return <View key={index} style={styles.star}>{star}</View>;
    }

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handlePress(index)}
        style={styles.star}
        activeOpacity={0.7}
      >
        {star}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
});
