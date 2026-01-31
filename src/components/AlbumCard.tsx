import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';
import { Album, DeezerAlbum, AlbumStatus } from '../types';
import { StarRating } from './StarRating';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.md * 3) / 2;

interface AlbumCardProps {
  album: Album | DeezerAlbum;
  onPress: () => void;
  onQuickAdd?: (status: AlbumStatus) => void;
  showStatus?: boolean;
  showRating?: boolean;
  savedAlbum?: Album | null;
}

const isDeezerAlbum = (album: Album | DeezerAlbum): album is DeezerAlbum => {
  return 'cover' in album;
};

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  onPress,
  onQuickAdd,
  showStatus = true,
  showRating = true,
  savedAlbum,
}) => {
  const title = isDeezerAlbum(album) ? album.title : album.title;
  const artist = isDeezerAlbum(album) ? album.artist.name : album.artist;
  const coverUrl = isDeezerAlbum(album)
    ? album.cover_medium || album.cover
    : album.coverUrlMedium || album.coverUrl;
  const status = savedAlbum?.status || (!isDeezerAlbum(album) ? album.status : null);
  const rating = savedAlbum?.rating || (!isDeezerAlbum(album) ? album.rating : 0);

  const getStatusColor = (s: AlbumStatus) => {
    switch (s) {
      case 'favorite':
        return colors.favorite;
      case 'wishlist':
        return colors.wishlist;
      case 'listened':
        return colors.listened;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (s: AlbumStatus): 'heart' | 'bookmark' | 'checkmark-circle' => {
    switch (s) {
      case 'favorite':
        return 'heart';
      case 'wishlist':
        return 'bookmark';
      case 'listened':
        return 'checkmark-circle';
      default:
        return 'heart';
    }
  };

  const getStatusLabel = (s: AlbumStatus) => {
    switch (s) {
      case 'favorite':
        return 'Favori';
      case 'wishlist':
        return 'À écouter';
      case 'listened':
        return 'Écouté';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
        {showStatus && status && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Ionicons name={getStatusIcon(status)} size={12} color={colors.white} />
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>
        )}
        {onQuickAdd && !status && (
          <View style={styles.quickAddContainer}>
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.favorite }]}
              onPress={() => onQuickAdd('favorite')}
            >
              <Ionicons name="heart" size={16} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.wishlist }]}
              onPress={() => onQuickAdd('wishlist')}
            >
              <Ionicons name="bookmark" size={16} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.listened }]}
              onPress={() => onQuickAdd('listened')}
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
        {showRating && rating > 0 && (
          <StarRating rating={rating} size={14} readonly />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  statusText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  quickAddContainer: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    marginTop: spacing.sm,
  },
  title: {
    color: colors.textLight,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  artist: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
