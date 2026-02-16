import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { RootStackParamList, DeezerAlbum, AlbumStatus, LastFmArtistInfo, TicketmasterEvent } from '../types';
import { AlbumCard, LoadingSpinner } from '../components';
import { useAlbums } from '../context/AlbumsContext';
import { deezerApi } from '../services/deezerApi';
import { lastfmApi } from '../services/lastfmApi';
import { ticketmasterApi } from '../services/ticketmasterApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ArtistDetail'>;

const { width } = Dimensions.get('window');

const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
};

const formatNumber = (num: string): string => {
  const n = parseInt(num, 10);
  if (isNaN(n)) return num;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
};

export const ArtistDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { artistName, artistId, artistImage } = route.params;

  const { addAlbum, getAlbumByDeezerId } = useAlbums();

  const [artistInfo, setArtistInfo] = useState<LastFmArtistInfo | null>(null);
  const [albums, setAlbums] = useState<DeezerAlbum[]>([]);
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullBio, setShowFullBio] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(artistImage || '');

  useEffect(() => {
    loadArtistData();
  }, [artistName]);

  const loadArtistData = async () => {
    setIsLoading(true);
    try {
      // Load Last.fm info, Deezer albums and Ticketmaster events in parallel
      const [lastfmInfo, deezerArtist, ticketmasterEvents] = await Promise.all([
        lastfmApi.getArtistInfo(artistName).catch(() => null),
        artistId ? Promise.resolve({ id: artistId }) : deezerApi.searchArtist(artistName),
        ticketmasterApi.getArtistEvents(artistName).catch(() => []),
      ]);

      setEvents(ticketmasterEvents);

      if (lastfmInfo) {
        setArtistInfo(lastfmInfo);
      }

      if (deezerArtist) {
        // Get artist image from Deezer if we don't have one
        if (!imageUrl && !artistImage) {
          const fullArtist = await deezerApi.searchArtist(artistName);
          if (fullArtist?.picture_big) {
            setImageUrl(fullArtist.picture_big);
          }
        }

        // Load albums
        const response = await deezerApi.getArtistAlbums(deezerArtist.id, 50);
        const enrichedAlbums = (response.data || []).map(album => ({
          ...album,
          artist: album.artist || {
            id: deezerArtist.id,
            name: artistName,
            picture: '',
            picture_small: '',
            picture_medium: '',
            picture_big: '',
          },
        }));
        setAlbums(enrichedAlbums);
      }
    } catch (error) {
      console.error('Error loading artist:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations de l\'artiste.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = useCallback(async (album: DeezerAlbum, status: AlbumStatus) => {
    try {
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

  const bioSummary = artistInfo?.bio?.summary ? stripHtmlTags(artistInfo.bio.summary) : '';
  const bioFull = artistInfo?.bio?.content ? stripHtmlTags(artistInfo.bio.content) : '';
  const hasBio = bioSummary.length > 0;
  const bioText = showFullBio ? bioFull : bioSummary;

  const renderHeader = () => (
    <View>
      {/* Header with artist image */}
      <View style={styles.headerContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.coverImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.gradient}
        />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.artistName}>{artistName}</Text>
          {artistInfo?.stats && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(artistInfo.stats.listeners)}</Text>
                <Text style={styles.statLabel}>auditeurs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(artistInfo.stats.playcount)}</Text>
                <Text style={styles.statLabel}>écoutes</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Tags */}
      {artistInfo?.tags?.tag && artistInfo.tags.tag.length > 0 && (
        <View style={styles.section}>
          <View style={styles.tagsContainer}>
            {artistInfo.tags.tag.map((tag) => (
              <View key={tag.name} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Bio */}
      {hasBio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biographie</Text>
          <Text style={styles.bioText}>{bioText}</Text>
          {bioFull.length > bioSummary.length && (
            <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)}>
              <Text style={styles.readMoreText}>
                {showFullBio ? 'Voir moins' : 'Lire plus'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Concerts / Events */}
      {events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Prochains concerts ({events.length})
          </Text>
          {events.slice(0, 5).map((event) => {
            const date = new Date(event.dates.start.localDate);
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
            const year = date.getFullYear();
            const venue = event._embedded?.venues?.[0];
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => {
                  if (event.url) Linking.openURL(event.url).catch(() => {});
                }}
              >
                <View style={styles.eventDate}>
                  <Text style={styles.eventDay}>{day}</Text>
                  <Text style={styles.eventMonth}>{month}</Text>
                  <Text style={styles.eventYear}>{year}</Text>
                </View>
                <View style={styles.eventInfo}>
                  {venue && (
                    <Text style={styles.eventVenue} numberOfLines={1}>{venue.name}</Text>
                  )}
                  {venue && (
                    <Text style={styles.eventLocation} numberOfLines={1}>
                      {[venue.city?.name, venue.country?.name].filter(Boolean).join(', ')}
                    </Text>
                  )}
                  {event.name && event.name !== artistName && (
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.name}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
          {events.length > 5 && (
            <TouchableOpacity
              style={styles.seeAllEvents}
              onPress={() => {
                const url = `https://www.ticketmaster.com/search?q=${encodeURIComponent(artistName)}`;
                Linking.openURL(url).catch(() => {});
              }}
            >
              <Text style={styles.seeAllEventsText}>
                Voir tous les concerts ({events.length})
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Albums section title */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Discographie {albums.length > 0 ? `(${albums.length})` : ''}
        </Text>
      </View>
    </View>
  );

  const renderAlbumItem = ({ item }: { item: DeezerAlbum }) => {
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

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement de l'artiste..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={albums}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAlbumItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    position: 'relative',
    height: width * 0.75,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.card,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
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
  artistName: {
    color: colors.white,
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  statValue: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: spacing.md,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.textLight,
    fontSize: fontSize.sm,
  },
  bioText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  readMoreText: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eventDate: {
    alignItems: 'center',
    width: 50,
    marginRight: spacing.md,
  },
  eventDay: {
    color: colors.accent,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },
  eventMonth: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  eventYear: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  eventInfo: {
    flex: 1,
  },
  eventVenue: {
    color: colors.textLight,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  eventLocation: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  eventTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginTop: 2,
  },
  seeAllEvents: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  seeAllEventsText: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
