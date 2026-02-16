import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { RootStackParamList, DeezerAlbum, DeezerArtist, AlbumStatus, LastFmArtist } from '../types';
import { AlbumCard, LoadingSpinner, EmptyState } from '../components';
import { useAlbums } from '../context/AlbumsContext';
import { deezerApi } from '../services/deezerApi';
import { lastfmApi } from '../services/lastfmApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GenreWithImage {
  name: string;
  url: string;
  imageUrl?: string;
}

type ViewMode = 'albums' | 'artists';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addAlbum, getAlbumByDeezerId } = useAlbums();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerAlbum[]>([]);
  const [artistResults, setArtistResults] = useState<DeezerArtist[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [genres, setGenres] = useState<GenreWithImage[]>([]);
  const [lastfmArtists, setLastfmArtists] = useState<LastFmArtist[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Load Last.fm top tags (genres) with artist images on mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const tags = await lastfmApi.getTopTags(15);

        // Fetch a representative artist image for each genre
        const genresWithImages = await Promise.all(
          tags.map(async (tag) => {
            try {
              const artists = await lastfmApi.getTopArtistsByTag(tag.name, 1);
              if (artists.length > 0) {
                const deezerArtist = await deezerApi.searchArtist(artists[0].name);
                return {
                  ...tag,
                  imageUrl: deezerArtist?.picture_big || deezerArtist?.picture_medium,
                };
              }
            } catch {
              // Ignore errors for individual genres
            }
            return { ...tag, imageUrl: undefined };
          })
        );

        setGenres(genresWithImages);
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };
    loadGenres();
  }, []);

  const handleGenreSelect = useCallback(async (genre: GenreWithImage) => {
    setSelectedGenre(genre.name);
    setIsLoading(true);
    setHasSearched(true);
    setViewMode('artists');
    setQuery('');

    try {
      // Use Last.fm to get top artists for this genre/tag
      const lastfmArtistsList = await lastfmApi.getTopArtistsByTag(genre.name, 20);

      // Fetch Deezer artist info in parallel to get images
      const deezerArtistsPromises = lastfmArtistsList.map(async (artist) => {
        const deezerArtist = await deezerApi.searchArtist(artist.name);
        return deezerArtist;
      });

      const deezerArtistResults = await Promise.all(deezerArtistsPromises);
      // Filter out null results
      const validArtists = deezerArtistResults.filter((a): a is DeezerArtist => a !== null);

      setArtistResults(validArtists);
      setLastfmArtists([]);
      setResults([]);
    } catch (error) {
      console.error('Genre search error:', error);
      Alert.alert('Erreur', 'Impossible de charger les artistes de ce genre.');
      setArtistResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleArtistSelect = useCallback(async (artist: DeezerArtist) => {
    setSelectedGenre(null);
    setQuery(artist.name);
    setIsLoading(true);
    setViewMode('albums');

    try {
      const response = await deezerApi.getArtistAlbums(artist.id, 50);
      // Enrich albums with artist info (not included in artist albums endpoint)
      const enrichedAlbums = (response.data || []).map(album => ({
        ...album,
        artist: album.artist || {
          id: artist.id,
          name: artist.name,
          picture: artist.picture,
          picture_small: artist.picture_small,
          picture_medium: artist.picture_medium,
          picture_big: artist.picture_big,
        },
      }));
      setResults(enrichedAlbums);
      setArtistResults([]);
      setLastfmArtists([]);
    } catch (error) {
      console.error('Artist albums error:', error);
      Alert.alert('Erreur', 'Impossible de charger les albums de cet artiste.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Last.fm artist selection - search on Deezer
  const handleLastfmArtistSelect = useCallback(async (artist: LastFmArtist) => {
    setQuery(artist.name);
    setIsLoading(true);
    setViewMode('albums');

    try {
      // First find the artist on Deezer to get their ID
      const deezerArtist = await deezerApi.searchArtist(artist.name);

      if (deezerArtist) {
        // Get albums directly from artist endpoint (better results)
        const response = await deezerApi.getArtistAlbums(deezerArtist.id, 50);
        const enrichedAlbums = (response.data || []).map(album => ({
          ...album,
          artist: album.artist || {
            id: deezerArtist.id,
            name: deezerArtist.name,
            picture: deezerArtist.picture,
            picture_small: deezerArtist.picture_small,
            picture_medium: deezerArtist.picture_medium,
            picture_big: deezerArtist.picture_big,
          },
        }));
        setResults(enrichedAlbums);
      } else {
        // Fallback to album search
        const response = await deezerApi.searchAlbums(artist.name, 50);
        setResults(response.data || []);
      }
      setLastfmArtists([]);
      setArtistResults([]);
    } catch (error) {
      console.error('Artist search error:', error);
      Alert.alert('Erreur', 'Impossible de charger les albums de cet artiste.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setHasSearched(true);
    setViewMode('albums');
    setSelectedGenre(null);
    setArtistResults([]);

    try {
      const response = await deezerApi.searchAlbums(query.trim(), 50);
      setResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Erreur', 'Impossible de rechercher. Vérifiez votre connexion.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleQuickAdd = useCallback(async (album: DeezerAlbum, status: AlbumStatus) => {
    try {
      // Fetch full album details to get genre
      const albumDetails = await deezerApi.getAlbum(album.id);
      const genre = albumDetails.genres?.data?.[0]?.name;

      const albumData = deezerApi.deezerToAlbum(album);
      await addAlbum({
        ...albumData,
        genre,
        status,
        rating: 0,
      } as any);
      Alert.alert(
        'Ajouté !',
        `"${album.title}" a été ajouté à votre collection.`
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'album.');
    }
  }, [addAlbum]);

  const renderItem = ({ item }: { item: DeezerAlbum }) => {
    const savedAlbum = getAlbumByDeezerId(item.id);
    return (
      <AlbumCard
        album={item}
        onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id, fromDeezer: true })}
        onQuickAdd={savedAlbum ? undefined : (status) => handleQuickAdd(item, status)}
        savedAlbum={savedAlbum}
        showStatus={true}
        showRating={true}
      />
    );
  };

  const renderArtistItem = ({ item }: { item: DeezerArtist }) => (
    <TouchableOpacity
      style={styles.artistCard}
      onPress={() => handleArtistSelect(item)}
    >
      <Image
        source={{ uri: item.picture_medium || item.picture }}
        style={styles.artistImage}
        contentFit="cover"
      />
      <Text style={styles.artistName} numberOfLines={2}>{item.name}</Text>
      {item.nb_fan && (
        <Text style={styles.artistFans}>
          {item.nb_fan.toLocaleString()} fans
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderLastfmArtistItem = ({ item }: { item: LastFmArtist }) => (
    <TouchableOpacity
      style={styles.artistCard}
      onPress={() => handleLastfmArtistSelect(item)}
    >
      <Image
        source={{ uri: lastfmApi.getArtistImageUrl(item) }}
        style={styles.artistImage}
        contentFit="cover"
      />
      <Text style={styles.artistName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Rechercher</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.text} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Album, artiste..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color={colors.backgroundDark} />
        </TouchableOpacity>
      </View>

      {/* Selected genre indicator */}
      {selectedGenre && hasSearched && (
        <View style={styles.genreIndicator}>
          <Text style={styles.genreIndicatorText}>Genre : {selectedGenre}</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedGenre(null);
              setHasSearched(false);
              setResults([]);
              setArtistResults([]);
              setLastfmArtists([]);
              setViewMode('albums');
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.reInitSearch} onPress={()=>{
        setQuery('');setHasSearched(false);setLastfmArtists([]);setSelectedGenre(null)}
        }>
        <Text>Réinitialiser</Text>
      </TouchableOpacity>

      {isLoading ? (
        <LoadingSpinner message="Recherche en cours..." />
      ) : hasSearched && results.length === 0 && artistResults.length === 0 && lastfmArtists.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Aucun résultat"
          message={selectedGenre
            ? `Aucun artiste trouvé pour le genre "${selectedGenre}".`
            : `Aucun album trouvé pour "${query}". Essayez avec d'autres mots-clés.`}
        />
      ) : !hasSearched ? (
        <ScrollView style={styles.suggestionsScrollView} showsVerticalScrollIndicator={false}>
          {/* Artist Suggestions */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions d'artistes</Text>
            <View style={styles.suggestions}>
              {['Daft Punk', 'Stromae', 'Kendrick Lamar', 'Taylor Swift', 'The Weeknd'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setQuery(suggestion);
                    setSelectedGenre(null);
                    setTimeout(() => {
                      setIsLoading(true);
                      setHasSearched(true);
                      deezerApi.searchAlbums(suggestion, 50)
                        .then(response => setResults(response.data || []))
                        .catch(() => setResults([]))
                        .finally(() => setIsLoading(false));
                    }, 0);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Genre Cards with Images */}
          {genres.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Explorer par genre</Text>
              <View style={styles.genreGrid}>
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.name}
                    style={styles.genreCard}
                    onPress={() => handleGenreSelect(genre)}
                  >
                    <Image
                      source={{ uri: genre.imageUrl }}
                      style={styles.genreCardImage}
                      contentFit="cover"
                    />
                    <View style={styles.genreCardOverlay} />
                    <Text style={styles.genreCardText}>{genre.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : viewMode === 'artists' && lastfmArtists.length > 0 ? (
        <FlatList
          data={lastfmArtists}
          keyExtractor={(item) => item.name}
          renderItem={renderLastfmArtistItem}
          numColumns={3}
          columnWrapperStyle={styles.artistRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : viewMode === 'artists' && artistResults.length > 0 ? (
        <FlatList
          data={artistResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderArtistItem}
          numColumns={3}
          columnWrapperStyle={styles.artistRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textLight,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textLight,
    fontSize: fontSize.md,
    paddingVertical: spacing.sm + 2,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  suggestionsTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
  },
  suggestionsScrollView: {
    flex: 1,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreCard: {
    width: '48%',
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  genreCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  genreCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  genreCardText: {
    color: colors.textLight,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  genreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  genreIndicatorText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  artistRow: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  artistCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  artistImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
  },
  artistName: {
    color: colors.textLight,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  artistFans: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  reInitSearch: {
    height:30,
    backgroundColor: colors.accent,
    width:'92%',
    borderRadius:5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
  }
});
