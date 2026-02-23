import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

const getUserDoc = (uid: string) => doc(db, 'users', uid);

const fetchUserData = async (uid: string): Promise<{ username: string; createdAt: string; isPublic: boolean }> => {
  const snap = await getDoc(getUserDoc(uid));
  if (!snap.exists()) throw new Error('Profil utilisateur introuvable');
  const data = snap.data();
  return {
    username: data.username as string,
    createdAt: data.createdAt as string,
    isPublic: data.isPublic !== false, // défaut true si absent (albums existants)
  };
};

const toUser = (
  firebaseUser: { uid: string; email: string | null },
  username: string,
  createdAt: string,
  isPublic: boolean,
): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email ?? '',
  username,
  createdAt,
  isPublic,
});

export const authService = {
  /**
   * Crée un nouveau compte Firebase Auth et initialise le document Firestore de l'utilisateur.
   * Le profil est public par défaut (`isPublic: true`).
   */
  async register(email: string, username: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
    const now = new Date().toISOString();

    await setDoc(getUserDoc(credential.user.uid), {
      username,
      createdAt: now,
      isPublic: true,
    });

    return toUser(credential.user, username, now, true);
  },

  /** Connecte un utilisateur existant et retourne son profil Firestore. */
  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
    const { username, createdAt, isPublic } = await fetchUserData(credential.user.uid);
    return toUser(credential.user, username, createdAt, isPublic);
  },

  /** Déconnecte l'utilisateur courant de Firebase Auth. */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /** Retourne le profil Firestore de l'utilisateur actuellement connecté, ou `null` si non authentifié. */
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const { username, createdAt, isPublic } = await fetchUserData(firebaseUser.uid);
      return toUser(firebaseUser, username, createdAt, isPublic);
    } catch {
      return null;
    }
  },

  /**
   * Met à jour le profil de l'utilisateur (username et/ou email).
   * Si le username change, met à jour en batch le champ `username` sur tous ses albums (dénormalisation).
   */
  async updateProfile(updates: { username?: string; email?: string }): Promise<User> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Non authentifié');

    if (updates.email && updates.email !== firebaseUser.email) {
      await updateEmail(firebaseUser, updates.email.toLowerCase());
    }

    if (updates.username) {
      await updateDoc(getUserDoc(firebaseUser.uid), { username: updates.username });

      // Dénormalisation : mettre à jour le username sur tous les albums
      const albumsSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'albums'));
      if (!albumsSnap.empty) {
        const batch = writeBatch(db);
        albumsSnap.docs.forEach(d => batch.update(d.ref, { username: updates.username }));
        await batch.commit();
      }
    }

    const { username, createdAt, isPublic } = await fetchUserData(firebaseUser.uid);
    return toUser(firebaseUser, username, createdAt, isPublic);
  },

  /** Change le mot de passe après réauthentification avec l'ancien mot de passe. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) throw new Error('Non authentifié');

    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  },

  /**
   * Bascule la visibilité publique du profil.
   * Met à jour le champ `isPublic` sur le doc user + `isPublicFeed` sur tous ses albums en batch.
   */
  async updatePrivacy(isPublic: boolean): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Non authentifié');

    await updateDoc(getUserDoc(firebaseUser.uid), { isPublic });

    const albumsSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'albums'));
    if (!albumsSnap.empty) {
      const batch = writeBatch(db);
      albumsSnap.docs.forEach(d => batch.update(d.ref, { isPublicFeed: isPublic }));
      await batch.commit();
    }
  },

  /**
   * Supprime définitivement le compte : albums (batch), document Firestore, puis compte Firebase Auth.
   */
  async deleteAccount(): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Non authentifié');

    const albumsSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'albums'));
    if (!albumsSnap.empty) {
      const batch = writeBatch(db);
      albumsSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    await deleteDoc(getUserDoc(firebaseUser.uid));
    await deleteUser(firebaseUser);
  },
};
