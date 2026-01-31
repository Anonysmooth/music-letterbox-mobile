import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { RootStackParamList, DeezerAlbum } from '../types';
import { AlbumCard, LoadingSpinner, EmptyState } from '../components';
import { useAlbums } from '../context/AlbumsContext';
import { useAuth } from '../context/AuthContext';
import { deezerApi } from '../services/deezerApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { albums, getStats, isLoading, fetchAlbums } = useAlbums();
  const [trendingAlbums, setTrendingAlbums] = useState<DeezerAlbum[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const stats = getStats();

  const loadTrendingAlbums = async () => {
    try {
      const response = await deezerApi.getTopAlbums(10);
      setTrendingAlbums(response.data || []);
    } catch (error) {
      console.error('Error loading trending albums:', error);
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    loadTrendingAlbums();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAlbums(), loadTrendingAlbums()]);
    setRefreshing(false);
  }, [fetchAlbums]);

  const recentFavorites = albums
    .filter(a => a.status === 'favorite')
    .slice(0, 6);

  const recentAlbums = albums.slice(0, 6);

  const StatCard: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }> = ({
    icon,
    label,
    value,
    color,
  }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (isLoading && albums.length === 0) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.username}>{user?.username || 'Utilisateur'}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Ionicons name="musical-notes" size={28} color={colors.accent} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard icon="albums" label="Albums" value={stats.total} color={colors.textLight} />
          <StatCard icon="heart" label="Favoris" value={stats.favorites} color={colors.favorite} />
          <StatCard icon="bookmark" label="À écouter" value={stats.wishlist} color={colors.wishlist} />
          <StatCard icon="checkmark-circle" label="Écoutés" value={stats.listened} color={colors.listened} />
        </View>

        {/* Trending Albums */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tendances</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAll}>Voir plus</Text>
            </TouchableOpacity>
          </View>
          {loadingTrending ? (
            <LoadingSpinner size="small" />
          ) : (
            <FlatList
              horizontal
              data={trendingAlbums}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <AlbumCard
                    album={item}
                    onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id, fromDeezer: true })}
                    showStatus={false}
                    showRating={false}
                  />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        {/* Recent Favorites */}
        {recentFavorites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vos favoris récents</Text>
            </View>
            <FlatList
              horizontal
              data={recentFavorites}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <AlbumCard
                    album={item}
                    onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id })}
                  />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Recent Additions */}
        {recentAlbums.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ajouts récents</Text>
            </View>
            <FlatList
              horizontal
              data={recentAlbums}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <AlbumCard
                    album={item}
                    onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id })}
                  />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="musical-notes-outline"
              title="Commencez votre collection"
              message="Recherchez des albums et ajoutez-les à votre collection pour les retrouver ici."
              actionLabel="Rechercher"
              onAction={() => navigation.navigate('Search')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  username: {
    color: colors.textLight,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    color: colors.textLight,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  statLabel: {
    color: colors.text,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  seeAll: {
    color: colors.accent,
    fontSize: fontSize.sm,
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
  },
  horizontalCard: {
    width: 150,
    marginRight: spacing.md,
  },
  emptyContainer: {
    paddingTop: spacing.xl,
  },
});
