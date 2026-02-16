import { LastFmTopArtistsResponse, LastFmArtist } from '../types';
import { LASTFM_API_KEY } from '../config/apiKeys';

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0';

export const lastfmApi = {
  /**
   * Get top artists for a given tag/genre
   */
  async getTopArtistsByTag(tag: string, limit: number = 30): Promise<LastFmArtist[]> {
    const url = `${LASTFM_API_BASE}/?method=tag.gettopartists&tag=${encodeURIComponent(tag)}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data: LastFmTopArtistsResponse = await response.json();
    console.log(data.topartists?.artist)
    return data.topartists?.artist || [];
  },

  /**
   * Get top tags (genres) from Last.fm
   */
  async getTopTags(limit: number = 50): Promise<{ name: string; url: string }[]> {
    const url = `${LASTFM_API_BASE}/?method=chart.gettoptags&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    // API returns { tags: { tag: [...] } } not { toptags: { tag: [...] } }
    return data.tags?.tag || [];
  },

  /**
   * Get the best image URL from Last.fm artist images
   */
  getArtistImageUrl(artist: LastFmArtist, preferredSize: 'small' | 'medium' | 'large' | 'extralarge' = 'large'): string {
    const sizes = ['extralarge', 'large', 'medium', 'small'] as const;
    const startIndex = sizes.indexOf(preferredSize);

    // Try to find the preferred size or larger
    for (let i = startIndex; i < sizes.length; i++) {
      console.log(artist)
      const image = artist.image.find(img => img.size === sizes[i]);
      if (image && image['#text']) {
        return image['#text'];
      }
    }

    // Fallback to any available image
    const anyImage = artist.image.find(img => img['#text']);
    return anyImage?.['#text'] || '';
  },
};
