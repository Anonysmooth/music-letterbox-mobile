import { DeezerAlbum, DeezerSearchResponse, DeezerAlbumDetail, DeezerArtistResponse, DeezerArtist } from '../types';

const DEEZER_API_BASE = 'https://api.deezer.com';

// CORS proxy for development (Deezer API doesn't allow direct browser requests)
// In production, you would use your own backend proxy
const CORS_PROXY = 'https://corsproxy.io/?';

const fetchWithProxy = async (url: string) => {
  // On mobile, we can make direct requests to Deezer API
  // The CORS proxy is only needed for web
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Deezer API error: ${response.status}`);
  }
  return response.json();
};

export const deezerApi = {
  async searchAlbums(query: string, limit: number = 25): Promise<DeezerSearchResponse> {
    const encodedQuery = encodeURIComponent(query);
    const url = `${DEEZER_API_BASE}/search/album?q=${encodedQuery}&limit=${limit}`;
    return fetchWithProxy(url);
  },

  async getAlbum(id: number): Promise<DeezerAlbumDetail> {
    const url = `${DEEZER_API_BASE}/album/${id}`;
    return fetchWithProxy(url);
  },

  async getArtistAlbums(artistId: number, limit: number = 25): Promise<DeezerSearchResponse> {
    const url = `${DEEZER_API_BASE}/artist/${artistId}/albums?limit=${limit}`;
    return fetchWithProxy(url);
  },

  async searchArtist(name: string): Promise<DeezerArtist | null> {
    const url = `${DEEZER_API_BASE}/search/artist?q=${encodeURIComponent(name)}&limit=1`;
    const response = await fetchWithProxy(url);
    return response.data?.[0] || null;
  },

  async getTopAlbums(limit: number = 25): Promise<DeezerSearchResponse> {
    const url = `${DEEZER_API_BASE}/chart/0/albums?limit=${limit}`;
    return fetchWithProxy(url);
  },

  async getGenres(): Promise<{ data: Array<{ id: number; name: string; picture: string }> }> {
    const url = `${DEEZER_API_BASE}/genre`;
    return fetchWithProxy(url);
  },

  async getEditorialCategories(): Promise<{ data: Array<{ id: number; name: string; picture: string }> }> {
    const url = `${DEEZER_API_BASE}/editorial`;
    return fetchWithProxy(url);
  },

  async getEditorialReleases(editorialId: number, limit: number = 50): Promise<DeezerSearchResponse> {
    const url = `${DEEZER_API_BASE}/editorial/${editorialId}/releases?limit=${limit}`;
    return fetchWithProxy(url);
  },

  async getGenreAlbums(genreId: number, limit: number = 25): Promise<DeezerSearchResponse> {
    // const url = `${DEEZER_API_BASE}/genre/${genreId}/albums?limit=${limit}`;
    // https://api.deezer.com/editorial/152/selection
    const url = `${DEEZER_API_BASE}/editorial/${genreId}/selection`;
    // https://api.deezer.com/genre/0/artists
    console.log('url',url)
    return fetchWithProxy(url);
  },

  async getGenreArtists(genreId: number): Promise<DeezerArtistResponse> {
    const url = `${DEEZER_API_BASE}/genre/${genreId}/artists`;
    return fetchWithProxy(url);
  },

  // Helper to convert Deezer album to our Album format
  deezerToAlbum(deezerAlbum: DeezerAlbum): Partial<import('../types').Album> {
    return {
      deezerId: deezerAlbum.id,
      title: deezerAlbum.title,
      artist: deezerAlbum.artist.name,
      artistId: deezerAlbum.artist.id,
      coverUrl: deezerAlbum.cover_xl || deezerAlbum.cover_big,
      coverUrlSmall: deezerAlbum.cover_small,
      coverUrlMedium: deezerAlbum.cover_medium,
      coverUrlBig: deezerAlbum.cover_big,
      releaseDate: deezerAlbum.release_date,
      trackCount: deezerAlbum.nb_tracks,
    };
  },
};
