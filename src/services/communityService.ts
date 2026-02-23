import {
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CommunityAlbum, LikedByInfo } from '../types';

export const communityService = {
  /**
   * Récupère les derniers albums ajoutés par la communauté (tous statuts).
   * Filtre en mémoire l'utilisateur courant pour éviter les index composites `!=`.
   * Requiert l'index Firestore : albums | isPublicFeed ASC + createdAt DESC (collection group).
   */
  async getRecentCommunityAlbums(
    currentUserId: string,
    maxItems = 25,
  ): Promise<CommunityAlbum[]> {
    const q = query(
      collectionGroup(db, 'albums'),
      where('isPublicFeed', '==', true),
      orderBy('createdAt', 'desc'),
      limit(maxItems),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data() as CommunityAlbum)
      .filter(a => a.userId !== currentUserId)
      .slice(0, 10);
  },

  /**
   * Récupère les infos "aimé par" pour un album donné (favoris des autres users).
   * Retourne les 2 premiers usernames et le total.
   * Requiert l'index Firestore : albums | deezerId ASC + status ASC + isPublicFeed ASC (collection group).
   */
  async getLikedByInfo(
    deezerId: number,
    currentUserId: string,
  ): Promise<LikedByInfo> {
    const q = query(
      collectionGroup(db, 'albums'),
      where('deezerId', '==', deezerId),
      where('status', '==', 'favorite'),
      where('isPublicFeed', '==', true),
      limit(50),
    );
    const snap = await getDocs(q);
    const others = snap.docs
      .map(d => d.data() as CommunityAlbum)
      .filter(a => a.userId !== currentUserId);

    return {
      usernames: others.slice(0, 2).map(a => a.username),
      totalCount: others.length,
    };
  },
};
