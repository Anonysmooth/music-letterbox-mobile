import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { RootStackParamList, DeezerAlbum, AlbumStatus } from '../types';
import { AlbumCard, LoadingSpinner, EmptyState } from '../components';
import { useAlbums } from '../context/AlbumsContext';
import { deezerApi } from '../services/deezerApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addAlbum, getAlbumByDeezerId } = useAlbums();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeezerAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setHasSearched(true);

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

      {isLoading ? (
        <LoadingSpinner message="Recherche en cours..." />
      ) : hasSearched && results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Aucun résultat"
          message={`Aucun album trouvé pour "${query}". Essayez avec d'autres mots-clés.`}
        />
      ) : !hasSearched ? (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions de recherche</Text>
          <View style={styles.suggestions}>
            {['Daft Punk', 'Stromae', 'Kendrick Lamar', 'Taylor Swift', 'The Weeknd'].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => {
                  setQuery(suggestion);
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
});
