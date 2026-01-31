import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Album, AlbumStatus, AlbumsState, CollectionStats } from '../types';
import { storage } from '../services/storage';
import { useAuth } from './AuthContext';

interface AlbumsContextType extends AlbumsState {
  fetchAlbums: () => Promise<void>;
  addAlbum: (album: Omit<Album, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Album>;
  updateAlbum: (id: string, updates: Partial<Album>) => Promise<void>;
  updateAlbumByDeezerId: (deezerId: number, updates: Partial<Album>) => Promise<void>;
  removeAlbum: (id: string) => Promise<void>;
  getAlbumByDeezerId: (deezerId: number) => Album | null;
  getAlbumsByStatus: (status: AlbumStatus) => Album[];
  getStats: () => CollectionStats;
}

const AlbumsContext = createContext<AlbumsContextType | undefined>(undefined);

export const useAlbums = (): AlbumsContextType => {
  const context = useContext(AlbumsContext);
  if (!context) {
    throw new Error('useAlbums must be used within an AlbumsProvider');
  }
  return context;
};

interface AlbumsProviderProps {
  children: ReactNode;
}

export const AlbumsProvider: React.FC<AlbumsProviderProps> = ({ children }) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchAlbums = useCallback(async () => {
    if (!isAuthenticated) {
      setAlbums([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const storedAlbums = await storage.getAlbums();
      setAlbums(storedAlbums);
    } catch (err) {
      setError('Erreur lors du chargement des albums');
      console.error('Fetch albums error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const addAlbum = async (albumData: Omit<Album, 'id' | 'createdAt' | 'updatedAt'>): Promise<Album> => {
    setError(null);
    try {
      const newAlbum = await storage.addAlbum(albumData);
      setAlbums(prev => {
        const existingIndex = prev.findIndex(a => a.deezerId === newAlbum.deezerId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newAlbum;
          return updated;
        }
        return [newAlbum, ...prev];
      });
      return newAlbum;
    } catch (err) {
      setError('Erreur lors de l\'ajout de l\'album');
      throw err;
    }
  };

  const updateAlbum = async (id: string, updates: Partial<Album>): Promise<void> => {
    setError(null);
    try {
      const updatedAlbum = await storage.updateAlbum(id, updates);
      if (updatedAlbum) {
        setAlbums(prev => prev.map(a => a.id === id ? updatedAlbum : a));
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'album');
      throw err;
    }
  };

  const updateAlbumByDeezerId = async (deezerId: number, updates: Partial<Album>): Promise<void> => {
    setError(null);
    try {
      const updatedAlbum = await storage.updateAlbumByDeezerId(deezerId, updates);
      if (updatedAlbum) {
        setAlbums(prev => prev.map(a => a.deezerId === deezerId ? updatedAlbum : a));
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'album');
      throw err;
    }
  };

  const removeAlbum = async (id: string): Promise<void> => {
    setError(null);
    try {
      await storage.removeAlbum(id);
      setAlbums(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Erreur lors de la suppression de l\'album');
      throw err;
    }
  };

  const getAlbumByDeezerId = (deezerId: number): Album | null => {
    return albums.find(a => a.deezerId === deezerId) || null;
  };

  const getAlbumsByStatus = (status: AlbumStatus): Album[] => {
    return albums.filter(a => a.status === status);
  };

  const getStats = (): CollectionStats => {
    const favorites = albums.filter(a => a.status === 'favorite');
    const wishlist = albums.filter(a => a.status === 'wishlist');
    const listened = albums.filter(a => a.status === 'listened');

    const ratedAlbums = albums.filter(a => a.rating > 0);
    const averageRating = ratedAlbums.length > 0
      ? ratedAlbums.reduce((sum, a) => sum + a.rating, 0) / ratedAlbums.length
      : 0;

    // Top artists
    const artistCounts: Record<string, number> = {};
    albums.forEach(a => {
      artistCounts[a.artist] = (artistCounts[a.artist] || 0) + 1;
    });
    const topArtists = Object.entries(artistCounts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top genres
    const genreCounts: Record<string, number> = {};
    albums.forEach(a => {
      if (a.genre) {
        genreCounts[a.genre] = (genreCounts[a.genre] || 0) + 1;
      }
    });
    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedAlbums.forEach(a => {
      const rounded = Math.round(a.rating);
      if (rounded >= 1 && rounded <= 5) {
        ratingDistribution[rounded]++;
      }
    });

    return {
      total: albums.length,
      favorites: favorites.length,
      wishlist: wishlist.length,
      listened: listened.length,
      averageRating,
      topArtists,
      topGenres,
      ratingDistribution,
    };
  };

  return (
    <AlbumsContext.Provider
      value={{
        albums,
        isLoading,
        error,
        fetchAlbums,
        addAlbum,
        updateAlbum,
        updateAlbumByDeezerId,
        removeAlbum,
        getAlbumByDeezerId,
        getAlbumsByStatus,
        getStats,
      }}
    >
      {children}
    </AlbumsContext.Provider>
  );
};
