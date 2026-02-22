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

const fetchUsername = async (uid: string): Promise<string> => {
  const snap = await getDoc(getUserDoc(uid));
  if (!snap.exists()) throw new Error('Profil utilisateur introuvable');
  return snap.data().username as string;
};

const toUser = (firebaseUser: { uid: string; email: string | null }, username: string, createdAt: string): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email ?? '',
  username,
  createdAt,
});

export const authService = {
  async register(email: string, username: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
    const now = new Date().toISOString();

    await setDoc(getUserDoc(credential.user.uid), {
      username,
      createdAt: now,
    });

    return toUser(credential.user, username, now);
  },

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
    const snap = await getDoc(getUserDoc(credential.user.uid));
    const data = snap.data();

    return toUser(
      credential.user,
      data?.username ?? '',
      data?.createdAt ?? credential.user.metadata.creationTime ?? new Date().toISOString(),
    );
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const username = await fetchUsername(firebaseUser.uid);
      const snap = await getDoc(getUserDoc(firebaseUser.uid));
      const data = snap.data();
      return toUser(
        firebaseUser,
        username,
        data?.createdAt ?? firebaseUser.metadata.creationTime ?? new Date().toISOString(),
      );
    } catch {
      return null;
    }
  },

  async updateProfile(updates: { username?: string; email?: string }): Promise<User> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Non authentifié');

    if (updates.email && updates.email !== firebaseUser.email) {
      await updateEmail(firebaseUser, updates.email.toLowerCase());
    }

    if (updates.username) {
      await updateDoc(getUserDoc(firebaseUser.uid), { username: updates.username });
    }

    const username = updates.username ?? await fetchUsername(firebaseUser.uid);
    const snap = await getDoc(getUserDoc(firebaseUser.uid));
    const data = snap.data();

    return toUser(
      firebaseUser,
      username,
      data?.createdAt ?? firebaseUser.metadata.creationTime ?? new Date().toISOString(),
    );
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) throw new Error('Non authentifié');

    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  },

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
