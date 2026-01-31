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
import { RootStackParamList, DeezerAlbum, DeezerArtist, AlbumStatus } from '../types';
import { AlbumCard, LoadingSpinner, EmptyState } from '../components';
import { useAlbums } from '../context/AlbumsContext';
import { deezerApi } from '../services/deezerApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DeezerGenre {
  id: number;
  name: string;
  picture: string;
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
  const [genres, setGenres] = useState<DeezerGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Load genres on mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await deezerApi.getGenres();
        // Filter out "All" genre (id: 0) and limit to main genres
        const filteredGenres = response.data.filter(g => g.id !== 0);
        setGenres(filteredGenres);
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };
    loadGenres();
  }, []);

  const handleGenreSelect = useCallback(async (genre: DeezerGenre) => {
    setSelectedGenre(genre.name);
    setIsLoading(true);
    setHasSearched(true);
    setViewMode('artists');
    setQuery('');

    try {
      const response = await deezerApi.getGenreArtists(genre.id);
      setArtistResults(response.data || []);
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
    } catch (error) {
      console.error('Artist albums error:', error);
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
      const albumData = deezerApi.deezerToAlbum(album);
      await addAlbum({
        ...albumData,
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
              setViewMode('albums');
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.reInitSearch} onPress={()=>{
        setQuery('');setHasSearched(false)}
        }>
        <Text>Réinitialiser</Text>
      </TouchableOpacity>

      {isLoading ? (
        <LoadingSpinner message="Recherche en cours..." />
      ) : hasSearched && results.length === 0 && artistResults.length === 0 ? (
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

          {/* Genre Suggestions */}
          {genres.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Explorer par genre</Text>
              <View style={styles.suggestions}>
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[styles.suggestionChip, styles.genreChip]}
                    onPress={() => handleGenreSelect(genre)}
                  >
                    <Ionicons name="musical-notes" size={14} color={colors.accent} />
                    <Text style={styles.suggestionText}>{genre.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
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
