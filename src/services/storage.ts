import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Album, AlbumStatus } from '../types';

/** Retourne la référence à la sous-collection albums de l'utilisateur connecté. */
const getAlbumsCol = () => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Non authentifié');
  return collection(db, 'users', uid, 'albums');
};

/** Retourne la référence à un document album précis de l'utilisateur connecté. */
const getAlbumDoc = (albumId: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Non authentifié');
  return doc(db, 'users', uid, 'albums', albumId);
};

/** Firestore ne tolère pas les valeurs `undefined` — on les supprime avant l'écriture. */
const stripUndefined = <T extends object>(obj: T): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const storage = {
  /** Récupère tous les albums de l'utilisateur, triés du plus récent au plus ancien. */
  async getAlbums(): Promise<Album[]> {
    const q = query(getAlbumsCol(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Album);
  },

  /**
   * Ajoute un album à la collection de l'utilisateur.
   * Si un album avec le même `deezerId` existe déjà, il est mis à jour plutôt que dupliqué.
   */
  async addAlbum(album: Omit<Album, 'id' | 'createdAt' | 'updatedAt'>): Promise<Album> {
    const existing = await this.getAlbumByDeezerId(album.deezerId);

    const now = new Date().toISOString();
    const newAlbum: Album = {
      ...album,
      id: existing ? existing.id : `album_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await setDoc(getAlbumDoc(newAlbum.id), stripUndefined(newAlbum));
    return newAlbum;
  },

  /**
   * Met à jour un album existant par son `id` interne.
   * Retourne l'album mis à jour, ou `null` s'il n'existe pas.
   */
  async updateAlbum(id: string, updates: Partial<Album>): Promise<Album | null> {
    const ref = getAlbumDoc(id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const updatedAlbum: Album = {
      ...snap.data() as Album,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(ref, stripUndefined(updatedAlbum));
    return updatedAlbum;
  },

  /**
   * Met à jour un album existant par son identifiant Deezer.
   * Utile quand on n'a pas encore l'`id` interne (ex: depuis une recherche Deezer).
   * Retourne l'album mis à jour, ou `null` s'il n'existe pas.
   */
  async updateAlbumByDeezerId(deezerId: number, updates: Partial<Album>): Promise<Album | null> {
    const q = query(getAlbumsCol(), where('deezerId', '==', deezerId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const updatedAlbum: Album = {
      ...docSnap.data() as Album,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docSnap.ref, stripUndefined(updatedAlbum));
    return updatedAlbum;
  },

  /** Supprime un album de la collection par son `id` interne. */
  async removeAlbum(id: string): Promise<void> {
    await deleteDoc(getAlbumDoc(id));
  },

  /** Retourne tous les albums d'un statut donné (`favorite`, `wishlist`, `listened`). */
  async getAlbumsByStatus(status: AlbumStatus): Promise<Album[]> {
    const q = query(
      getAlbumsCol(),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Album);
  },

  /**
   * Recherche un album par son identifiant Deezer.
   * Retourne `null` s'il n'est pas dans la collection de l'utilisateur.
   */
  async getAlbumByDeezerId(deezerId: number): Promise<Album | null> {
    const q = query(getAlbumsCol(), where('deezerId', '==', deezerId), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data() as Album;
  },

  /** Supprime tous les albums de la collection de l'utilisateur. */
  async clearAll(): Promise<void> {
    const snap = await getDocs(getAlbumsCol());
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },
};
