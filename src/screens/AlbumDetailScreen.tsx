import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { RootStackParamList, Album, DeezerAlbumDetail, AlbumStatus, LikedByInfo } from '../types';
import { StarRating, StatusSelector, Button, LoadingSpinner, Input } from '../components';
import { useAlbums } from '../context/AlbumsContext';
import { useAuth } from '../context/AuthContext';
import { deezerApi } from '../services/deezerApi';
import { communityService } from '../services/communityService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'AlbumDetail'>;

const { width } = Dimensions.get('window');

export const AlbumDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { albumId, fromDeezer } = route.params;

  const { albums, addAlbum, updateAlbum, removeAlbum, getAlbumByDeezerId } = useAlbums();
  const { user } = useAuth();

  const [deezerAlbum, setDeezerAlbum] = useState<DeezerAlbumDetail | null>(null);
  const [localAlbum, setLocalAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<AlbumStatus | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [likedByInfo, setLikedByInfo] = useState<LikedByInfo | null>(null);
  const [trackModal, setTrackModal] = useState<{ visible: boolean; title: string; artist: string }>({
    visible: false,
    title: '',
    artist: '',
  });

  useEffect(() => {
    loadAlbum();
  }, [albumId, fromDeezer]);

  const loadAlbum = async () => {
    setIsLoading(true);
    try {
      let resolvedDeezerId: number | undefined;

      if (fromDeezer) {
        // Load from Deezer API
        const deezerId = typeof albumId === 'string' ? parseInt(albumId, 10) : albumId;
        resolvedDeezerId = deezerId;
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
            resolvedDeezerId = album.deezerId;
            const deezer = await deezerApi.getAlbum(album.deezerId);
            setDeezerAlbum(deezer);
          }
        }
      }

      // Charger les infos "aimé par" quel que soit le chemin de navigation
      if (user?.id && resolvedDeezerId) {
        communityService.getLikedByInfo(resolvedDeezerId, user.id)
          .then(info => { if (info.totalCount > 0) setLikedByInfo(info); })
          .catch(err => console.error('getLikedByInfo error:', err));
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
  const deezerId = deezerAlbum?.id || localAlbum?.deezerId;

  const searchQuery = encodeURIComponent(`${artist} ${title}`);

  const streamingPlatforms = [
    {
      name: 'Deezer',
      icon: 'deezer' as const,
      color: '#A238FF',
      albumUrl: deezerId ? `https://www.deezer.com/album/${deezerId}` : null,
    },
    {
      name: 'Spotify',
      icon: 'spotify' as const,
      color: '#1DB954',
      albumUrl: `https://open.spotify.com/search/${searchQuery}`,
    },
    {
      name: 'Apple Music',
      icon: 'apple' as const,
      color: '#FC3C44',
      albumUrl: `https://music.apple.com/search?term=${searchQuery}`,
    },
    {
      name: 'YouTube Music',
      icon: 'youtube' as const,
      color: '#FF0000',
      albumUrl: `https://music.youtube.com/search?q=${searchQuery}`,
    },
  ];

  const purchasePlatforms = [
    {
      name: 'Amazon',
      icon: 'amazon' as const,
      color: '#FF9900',
      url: `https://www.amazon.fr/s?k=${searchQuery}+CD+vinyle&i=music`,
    },
    {
      name: 'Fnac',
      icon: 'store' as const,
      color: '#E1A400',
      url: `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${searchQuery}&sft=1&sa=0`,
    },
    {
      name: 'Discogs',
      icon: 'compact-disc' as const,
      color: '#FF5722',
      url: `https://www.discogs.com/search/?q=${searchQuery}&type=release`,
    },
  ];

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien.');
    });
  };

  const openOnPlatform = async (deepLink: string, webUrl: string) => {
    try {
      await Linking.openURL(deepLink);
    } catch {
      openLink(webUrl);
    }
  };

  const openTrackOnPlatform = (trackTitle: string, trackArtist: string) => {
    setTrackModal({ visible: true, title: trackTitle, artist: trackArtist });
  };

  const getTrackPlatforms = () => {
    const query = encodeURIComponent(`${trackModal.artist} ${trackModal.title}`);
    return [
      {
        name: 'Deezer',
        icon: 'deezer' as const,
        color: '#A238FF',
        deepLink: `deezer://www.deezer.com/search/${query}`,
        webUrl: `https://www.deezer.com/search/${query}`,
      },
      {
        name: 'Spotify',
        icon: 'spotify' as const,
        color: '#1DB954',
        deepLink: `spotify:search:${trackModal.artist} ${trackModal.title}`,
        webUrl: `https://open.spotify.com/search/${query}`,
      },
      {
        name: 'Apple Music',
        icon: 'apple' as const,
        color: '#FC3C44',
        deepLink: `music://music.apple.com/search?term=${query}`,
        webUrl: `https://music.apple.com/search?term=${query}`,
      },
      {
        name: 'YouTube Music',
        icon: 'youtube' as const,
        color: '#FF0000',
        deepLink: `vnd.youtube.music://music.youtube.com/search?q=${query}`,
        webUrl: `https://music.youtube.com/search?q=${query}`,
      },
    ];
  };

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
            <TouchableOpacity
              onPress={() => navigation.navigate('ArtistDetail', {
                artistName: artist,
                artistId: deezerAlbum?.artist?.id || localAlbum?.artistId,
                artistImage: deezerAlbum?.artist?.picture_big || deezerAlbum?.artist?.picture_medium,
              })}
            >
              <Text style={[styles.artist, styles.artistLink]}>{artist}</Text>
            </TouchableOpacity>
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

        {/* Liked by */}
        {likedByInfo && likedByInfo.totalCount > 0 && (
          <View style={styles.section}>
            <View style={styles.likedByContainer}>
              <Ionicons name="heart" size={16} color={colors.favorite} />
              <Text style={styles.likedByText}>
                {likedByInfo.totalCount === 1
                  ? `Aimé par ${likedByInfo.usernames[0]}`
                  : likedByInfo.totalCount === 2
                  ? `Aimé par ${likedByInfo.usernames[0]} et ${likedByInfo.usernames[1]}`
                  : `Aimé par ${likedByInfo.usernames[0]}, ${likedByInfo.usernames[1]} et ${likedByInfo.totalCount - 2} autre${likedByInfo.totalCount - 2 > 1 ? 's' : ''}`
                }
              </Text>
            </View>
          </View>
        )}

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

        
        {/* Streaming Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Écouter sur</Text>
          <View style={styles.streamingContainer}>
            {streamingPlatforms.map((platform) =>
              platform.albumUrl ? (
                <TouchableOpacity
                  key={platform.name}
                  style={[styles.streamingButton, { borderColor: platform.color }]}
                  onPress={() => openLink(platform.albumUrl!)}
                >
                  <FontAwesome5 name={platform.icon} size={20} color={platform.color} />
                </TouchableOpacity>
              ) : null
            )}
          </View>
        </View>

        {/* Purchase Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acheter sur</Text>
          <View style={styles.streamingContainer}>
            {purchasePlatforms.map((platform) => (
              <TouchableOpacity
                key={platform.name}
                style={[styles.streamingButton, { borderColor: platform.color }]}
                onPress={() => openLink(platform.url)}
              >
                <FontAwesome5 name={platform.icon} size={20} color={platform.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tracklist */}
        {tracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liste des titres</Text>
            <View style={styles.trackList}>
              {tracks.map((track, index) => (
                <View key={track.id} style={styles.trackItem}>
                  <Text style={styles.trackNumber}>{index + 1}</Text>
                  <TouchableOpacity
                    style={styles.trackInfo}
                    onPress={() => openTrackOnPlatform(track.title, track.artist.name)}
                  >
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    {track.artist.name !== artist && (
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {track.artist.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Track Streaming Modal */}
      <Modal
        visible={trackModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setTrackModal(prev => ({ ...prev, visible: false }))}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTrackModal(prev => ({ ...prev, visible: false }))}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              {trackModal.title}
            </Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              {trackModal.artist}
            </Text>
            <View style={styles.modalPlatforms}>
              {getTrackPlatforms().map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={styles.modalPlatformButton}
                  onPress={() => {
                    setTrackModal(prev => ({ ...prev, visible: false }));
                    openOnPlatform(p.deepLink, p.webUrl);
                  }}
                >
                  <View style={[styles.modalPlatformIcon, { borderColor: p.color }]}>
                    <FontAwesome5 name={p.icon} size={22} color={p.color} />
                  </View>
                  <Text style={styles.modalPlatformName}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setTrackModal(prev => ({ ...prev, visible: false }))}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  artistLink: {
    textDecorationLine: 'underline',
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
  streamingContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streamingButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: width - spacing.lg * 2,
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.textLight,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.text,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  modalPlatforms: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  modalPlatformButton: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalPlatformIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPlatformName: {
    color: colors.text,
    fontSize: fontSize.xs,
  },
  modalCancel: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  likedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
  },
  likedByText: {
    color: colors.text,
    fontSize: fontSize.sm,
    flex: 1,
  },
});
