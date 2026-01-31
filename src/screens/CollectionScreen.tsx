import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { RootStackParamList, Album, AlbumStatus } from '../types';
import { AlbumCard, LoadingSpinner, EmptyState } from '../components';
import { useAlbums } from '../context/AlbumsContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | AlbumStatus;
type SortType = 'recent' | 'title' | 'artist' | 'rating';

interface FilterOption {
  key: FilterType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const filterOptions: FilterOption[] = [
  { key: 'all', label: 'Tous', icon: 'albums', color: colors.textLight },
  { key: 'favorite', label: 'Favoris', icon: 'heart', color: colors.favorite },
  { key: 'wishlist', label: 'À écouter', icon: 'bookmark', color: colors.wishlist },
  { key: 'listened', label: 'Écoutés', icon: 'checkmark-circle', color: colors.listened },
];

export const CollectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { albums, isLoading } = useAlbums();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');

  const filteredAlbums = useMemo(() => {
    let filtered = [...albums];

    // Apply filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(a => a.status === activeFilter);
    }

    // Apply sort
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'artist':
        filtered.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [albums, activeFilter, sortBy]);

  const renderFilterButton = (option: FilterOption) => {
    const isActive = activeFilter === option.key;
    const count = option.key === 'all'
      ? albums.length
      : albums.filter(a => a.status === option.key).length;

    return (
      <TouchableOpacity
        key={option.key}
        style={[
          styles.filterButton,
          isActive && { backgroundColor: option.color, borderColor: option.color },
        ]}
        onPress={() => setActiveFilter(option.key)}
      >
        <Ionicons
          name={option.icon}
          size={16}
          color={isActive ? colors.white : option.color}
        />
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {option.label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Album }) => (
    <AlbumCard
      album={item}
      onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id })}
    />
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement de votre collection..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Collection</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            const sorts: SortType[] = ['recent', 'title', 'artist', 'rating'];
            const currentIndex = sorts.indexOf(sortBy);
            setSortBy(sorts[(currentIndex + 1) % sorts.length]);
          }}
        >
          <Ionicons name="swap-vertical" size={20} color={colors.text} />
          <Text style={styles.sortText}>
            {sortBy === 'recent' ? 'Récent' : sortBy === 'title' ? 'Titre' : sortBy === 'artist' ? 'Artiste' : 'Note'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        {filterOptions.map(renderFilterButton)}
      </View>

      {filteredAlbums.length === 0 ? (
        <EmptyState
          icon={activeFilter === 'all' ? 'albums-outline' : filterOptions.find(f => f.key === activeFilter)?.icon || 'albums-outline'}
          title={activeFilter === 'all' ? 'Collection vide' : `Aucun album ${filterOptions.find(f => f.key === activeFilter)?.label.toLowerCase()}`}
          message={activeFilter === 'all'
            ? 'Commencez par rechercher des albums et ajoutez-les à votre collection.'
            : `Vous n'avez pas encore d'albums dans cette catégorie.`
          }
          actionLabel="Rechercher"
          onAction={() => navigation.navigate('Search')}
        />
      ) : (
        <FlatList
          data={filteredAlbums}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textLight,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  sortText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 4,
  },
  filterText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
});
