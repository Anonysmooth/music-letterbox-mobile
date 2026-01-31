import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Album, User, AlbumStatus } from '../types';

const STORAGE_KEYS = {
  USER: '@music_letterbox_user',
  AUTH_TOKEN: 'auth_token',
  ALBUMS: '@music_letterbox_albums',
  SETTINGS: '@music_letterbox_settings',
};

// Secure storage for sensitive data (tokens, passwords)
export const secureStorage = {
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  },
};

// Regular storage for non-sensitive data
export const storage = {
  // User management
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Albums management
  async getAlbums(): Promise<Album[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ALBUMS);
    return data ? JSON.parse(data) : [];
  },

  async saveAlbums(albums: Album[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(albums));
  },

  async addAlbum(album: Omit<Album, 'id' | 'createdAt' | 'updatedAt'>): Promise<Album> {
    const albums = await this.getAlbums();

    // Check if album already exists
    const existingIndex = albums.findIndex(a => a.deezerId === album.deezerId);

    const now = new Date().toISOString();
    const newAlbum: Album = {
      ...album,
      id: existingIndex >= 0 ? albums[existingIndex].id : `album_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: existingIndex >= 0 ? albums[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      albums[existingIndex] = newAlbum;
    } else {
      albums.unshift(newAlbum);
    }

    await this.saveAlbums(albums);
    return newAlbum;
  },

  async updateAlbum(id: string, updates: Partial<Album>): Promise<Album | null> {
    const albums = await this.getAlbums();
    const index = albums.findIndex(a => a.id === id);

    if (index === -1) return null;

    albums[index] = {
      ...albums[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveAlbums(albums);
    return albums[index];
  },

  async updateAlbumByDeezerId(deezerId: number, updates: Partial<Album>): Promise<Album | null> {
    const albums = await this.getAlbums();
    const index = albums.findIndex(a => a.deezerId === deezerId);

    if (index === -1) return null;

    albums[index] = {
      ...albums[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveAlbums(albums);
    return albums[index];
  },

  async removeAlbum(id: string): Promise<void> {
    const albums = await this.getAlbums();
    const filtered = albums.filter(a => a.id !== id);
    await this.saveAlbums(filtered);
  },

  async getAlbumsByStatus(status: AlbumStatus): Promise<Album[]> {
    const albums = await this.getAlbums();
    return albums.filter(a => a.status === status);
  },

  async getAlbumByDeezerId(deezerId: number): Promise<Album | null> {
    const albums = await this.getAlbums();
    return albums.find(a => a.deezerId === deezerId) || null;
  },

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.ALBUMS,
      STORAGE_KEYS.SETTINGS,
    ]);
    await secureStorage.removeToken();
  },
};
