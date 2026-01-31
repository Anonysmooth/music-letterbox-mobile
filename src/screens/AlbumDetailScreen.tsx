import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { RootStackParamList, Album, DeezerAlbumDetail, AlbumStatus } from '../types';
import { StarRating, StatusSelector, Button, LoadingSpinner, Input } from '../components';
import { useAlbums } from '../context/AlbumsContext';
import { deezerApi } from '../services/deezerApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'AlbumDetail'>;

const { width } = Dimensions.get('window');

export const AlbumDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { albumId, fromDeezer } = route.params;

  const { albums, addAlbum, updateAlbum, removeAlbum, getAlbumByDeezerId } = useAlbums();

  const [deezerAlbum, setDeezerAlbum] = useState<DeezerAlbumDetail | null>(null);
  const [localAlbum, setLocalAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<AlbumStatus | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAlbum();
  }, [albumId, fromDeezer]);

  const loadAlbum = async () => {
    setIsLoading(true);
    try {
      if (fromDeezer) {
        // Load from Deezer API
        const deezerId = typeof albumId === 'string' ? parseInt(albumId, 10) : albumId;
        const album = await deezerApi.getAlbum(deezerId);
        setDeezerAlbum(album);

        // Check if we have it locally
        const saved = getAlbumByDeezerId(deezerId);
        if (saved) {
          setLocalAlbum(saved);
          setStatus(saved.status);
          setRating(saved.rating);
          setReview(saved.review || '');
        }
      } else {
        // Load from local storage
        const album = albums.find(a => a.id === albumId);
        if (album) {
          setLocalAlbum(album);
          setStatus(album.status);
          setRating(album.rating);
          setReview(album.review || '');

          // Also load Deezer details for tracks
          if (album.deezerId) {
            const deezer = await deezerApi.getAlbum(album.deezerId);
            setDeezerAlbum(deezer);
          }
        }
      }
    } catch (error) {
      console.error('Error loading album:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de l\'album.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!status) {
      Alert.alert('Erreur', 'Veuillez sélectionner un statut pour l\'album.');
      return;
    }

    setIsSaving(true);
    try {
      if (localAlbum) {
        // Update existing album
        await updateAlbum(localAlbum.id, { status, rating, review });
        setLocalAlbum(prev => prev ? { ...prev, status, rating, review } : null);
      } else if (deezerAlbum) {
        // Add new album
        const albumData = deezerApi.deezerToAlbum(deezerAlbum as any);
        const genre = deezerAlbum.genres?.data?.[0]?.name;
        const newAlbum = await addAlbum({
          ...albumData,
          genre,
          status,
          rating,
          review,
        } as any);
        setLocalAlbum(newAlbum);
      }
      Alert.alert('Enregistré', 'L\'album a été enregistré dans votre collection.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'album.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!localAlbum) return;

    Alert.alert(
      'Supprimer l\'album',
      'Êtes-vous sûr de vouloir supprimer cet album de votre collection ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAlbum(localAlbum.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'album.');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement de l'album..." />;
  }

  const album = deezerAlbum || localAlbum;
  if (!album) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Album non trouvé</Text>
      </SafeAreaView>
    );
  }

  const title = deezerAlbum?.title || localAlbum?.title || '';
  const artist = deezerAlbum?.artist?.name || localAlbum?.artist || '';
  const coverUrl = deezerAlbum?.cover_xl || deezerAlbum?.cover_big || localAlbum?.coverUrl || '';
  const releaseDate = deezerAlbum?.release_date || localAlbum?.releaseDate;
  const trackCount = deezerAlbum?.nb_tracks || localAlbum?.trackCount;
  const genre = deezerAlbum?.genres?.data?.[0]?.name || localAlbum?.genre;
  const tracks = deezerAlbum?.tracks?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with cover */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: coverUrl }} style={styles.coverImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.gradient}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.artist}>{artist}</Text>
            <View style={styles.metadata}>
              {releaseDate && (
                <Text style={styles.metaText}>{new Date(releaseDate).getFullYear()}</Text>
              )}
              {genre && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{genre}</Text>
                </>
              )}
              {trackCount && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{trackCount} titres</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Status Selector */}
        <View style={styles.section}>
          <StatusSelector currentStatus={status} onStatusChange={setStatus} />
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre note</Text>
          <View style={styles.ratingContainer}>
            <StarRating rating={rating} onRatingChange={setRating} size={32} />
            {rating > 0 && (
              <Text style={styles.ratingText}>{rating.toFixed(1)} / 5</Text>
            )}
          </View>
        </View>

        {/* Review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre critique</Text>
          <Input
            value={review}
            onChangeText={setReview}
            placeholder="Partagez votre avis sur cet album..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={localAlbum ? 'Mettre à jour' : 'Ajouter à ma collection'}
            onPress={handleSave}
            loading={isSaving}
            disabled={!status}
          />
          {localAlbum && (
            <Button
              title="Supprimer"
              onPress={handleDelete}
              variant="outline"
              style={styles.deleteButton}
            />
          )}
        </View>

        {/* Tracklist */}
        {tracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liste des titres</Text>
            <View style={styles.trackList}>
              {tracks.map((track, index) => (
                <View key={track.id} style={styles.trackItem}>
                  <Text style={styles.trackNumber}>{index + 1}</Text>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    {track.artist.name !== artist && (
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {track.artist.name}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration)}
                  </Text>
                </View>
              ))}
            </View>
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    position: 'relative',
    height: width,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  artist: {
    color: colors.white,
    fontSize: fontSize.lg,
    marginTop: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
  },
  metaDot: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    marginHorizontal: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ratingText: {
    color: colors.orange,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  deleteButton: {
    borderColor: colors.red,
  },
  trackList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trackNumber: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    width: 24,
  },
  trackInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  trackTitle: {
    color: colors.textLight,
    fontSize: fontSize.md,
  },
  trackArtist: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  trackDuration: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.md,
  },
  errorText: {
    color: colors.text,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
