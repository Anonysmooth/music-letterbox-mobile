import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useAlbums } from '../context/AlbumsContext';
import { Button } from '../components';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updatePrivacy } = useAuth();
  const { getStats, albums } = useAlbums();
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const stats = getStats();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handlePrivacyToggle = async (value: boolean) => {
    setIsUpdatingPrivacy(true);
    try {
      await updatePrivacy(value);
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la confidentialité.');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const MenuItem: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    color?: string;
  }> = ({ icon, label, value, onPress, color = colors.text }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.menuItemLabel, { color }]}>{label}</Text>
      </View>
      {value ? (
        <Text style={styles.menuItemValue}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            Membre depuis {user?.createdAt ? formatDate(user.createdAt) : 'récemment'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
            </Text>
            <Text style={styles.statLabel}>Note moy.</Text>
          </View>
        </View>

        {/* Top Artists */}
        {stats.topArtists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artistes les plus écoutés</Text>
            <View style={styles.topArtists}>
              {stats.topArtists.slice(0, 5).map((item, index) => (
                <View key={item.artist} style={styles.topArtistItem}>
                  <Text style={styles.topArtistRank}>#{index + 1}</Text>
                  <Text style={styles.topArtistName} numberOfLines={1}>
                    {item.artist}
                  </Text>
                  <Text style={styles.topArtistCount}>{item.count} albums</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Rating Distribution */}
        {albums.some(a => a.rating > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribution des notes</Text>
            <View style={styles.ratingDistribution}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const maxCount = Math.max(...Object.values(stats.ratingDistribution));
                const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <View key={rating} style={styles.ratingRow}>
                    <View style={styles.ratingStars}>
                      {Array.from({ length: rating }, (_, i) => (
                        <Ionicons key={i} name="star" size={12} color={colors.orange} />
                      ))}
                    </View>
                    <View style={styles.ratingBarContainer}>
                      <View style={[styles.ratingBar, { width: `${width}%` }]} />
                    </View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.menu}>
            <MenuItem
              icon="person-outline"
              label="Nom d'utilisateur"
              value={user?.username}
            />
            <MenuItem
              icon="mail-outline"
              label="Email"
              value={user?.email}
            />
          </View>
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          <View style={styles.menu}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={user?.isPublic ? 'earth-outline' : 'lock-closed-outline'}
                  size={22}
                  color={colors.text}
                />
                <View>
                  <Text style={styles.menuItemLabel}>
                    {user?.isPublic ? 'Profil public' : 'Profil privé'}
                  </Text>
                  <Text style={styles.privacySubtitle}>
                    {user?.isPublic
                      ? 'Vos albums apparaissent dans la communauté'
                      : 'Vos albums sont invisibles pour les autres'}
                  </Text>
                </View>
              </View>
              <Switch
                value={user?.isPublic ?? true}
                onValueChange={handlePrivacyToggle}
                disabled={isUpdatingPrivacy}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            title="Se déconnecter"
            onPress={handleLogout}
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={20} color={colors.white} />}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Music Letterbox v1.6.0</Text>
          <Text style={styles.appInfoText}>Propulsé par Deezer API</Text>
        </View>
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.backgroundDark,
  },
  username: {
    color: colors.textLight,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  email: {
    color: colors.text,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  memberSince: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    color: colors.textLight,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  topArtists: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  topArtistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topArtistRank: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: 'bold',
    width: 32,
  },
  topArtistName: {
    flex: 1,
    color: colors.textLight,
    fontSize: fontSize.md,
  },
  topArtistCount: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
  ratingDistribution: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingStars: {
    flexDirection: 'row',
    width: 70,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
  },
  ratingBar: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: 4,
  },
  ratingCount: {
    color: colors.text,
    fontSize: fontSize.sm,
    width: 24,
    textAlign: 'right',
  },
  menu: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuItemLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  menuItemValue: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  privacySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    maxWidth: 220,
  },
  logoutContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  appInfoText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
