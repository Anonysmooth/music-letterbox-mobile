export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Album {
  id: string;
  deezerId: number;
  title: string;
  artist: string;
  artistId?: number;
  coverUrl: string;
  coverUrlSmall?: string;
  coverUrlMedium?: string;
  coverUrlBig?: string;
  releaseDate?: string;
  genre?: string;
  trackCount?: number;
  status: AlbumStatus | null;
  rating: number;
  review?: string;
  listenedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type AlbumStatus = 'favorite' | 'wishlist' | 'listened';

export interface DeezerAlbum {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  genre_id?: number;
  nb_tracks: number;
  release_date: string;
  record_type: string;
  tracklist: string;
  artist: {
    id: number;
    name: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
  };
}

export interface DeezerArtist {
  id: number;
  name: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl?: string;
  nb_album?: number;
  nb_fan?: number;
}

export interface DeezerSearchResponse {
  data: DeezerAlbum[];
  total: number;
  next?: string;
}

export interface DeezerArtistResponse {
  data: DeezerArtist[];
  total?: number;
  next?: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  track_position: number;
  artist: {
    id: number;
    name: string;
  };
}

export interface DeezerAlbumDetail extends DeezerAlbum {
  genres?: {
    data: Array<{
      id: number;
      name: string;
    }>;
  };
  label?: string;
  duration?: number;
  tracks?: {
    data: DeezerTrack[];
  };
}

export interface CollectionStats {
  total: number;
  favorites: number;
  wishlist: number;
  listened: number;
  averageRating: number;
  topArtists: Array<{ artist: string; count: number }>;
  topGenres: Array<{ genre: string; count: number }>;
  ratingDistribution: Record<number, number>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AlbumsState {
  albums: Album[];
  isLoading: boolean;
  error: string | null;
}

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  AlbumDetail: { albumId: string | number; fromDeezer?: boolean };
  Search: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  SearchTab: undefined;
  Collection: undefined;
  Profile: undefined;
};
