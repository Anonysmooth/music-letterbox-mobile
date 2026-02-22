import { TicketmasterEvent, TicketmasterSearchResponse } from '../types';
import { TICKETMASTER_API_KEY } from '../config/apiKeys';

const TICKETMASTER_API_BASE = 'https://app.ticketmaster.com/discovery/v2';

interface TicketmasterAttraction {
  id: string;
  name: string;
}

interface TicketmasterAttractionSearchResponse {
  _embedded?: {
    attractions?: TicketmasterAttraction[];
  };
}

export const ticketmasterApi = {
  /**
   * Search for an artist's attractionId on Ticketmaster
   */
  async searchAttraction(artistName: string): Promise<string | null> {
    const url = `${TICKETMASTER_API_BASE}/attractions.json?keyword=${encodeURIComponent(artistName)}&classificationName=music&size=1&apikey=${TICKETMASTER_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: TicketmasterAttractionSearchResponse = await response.json();
    return data._embedded?.attractions?.[0]?.id || null;
  },

  /**
   * Get artist events (concerts + festivals) using attractionId for best results,
   * with keyword fallback
   */
  async getArtistEvents(artistName: string): Promise<TicketmasterEvent[]> {
    // First, resolve the artist to an attractionId
    const attractionId = await this.searchAttraction(artistName);

    let url: string;
    if (attractionId) {
      // attractionId gives us all events where the artist appears (including festivals)
      url = `${TICKETMASTER_API_BASE}/events.json?attractionId=${attractionId}&size=10&sort=date,asc&apikey=${TICKETMASTER_API_KEY}`;
    } else {
      // Fallback to keyword search
      url = `${TICKETMASTER_API_BASE}/events.json?keyword=${encodeURIComponent(artistName)}&classificationName=music&size=10&sort=date,asc&apikey=${TICKETMASTER_API_KEY}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data: TicketmasterSearchResponse = await response.json();
    return data._embedded?.events || [];
  },
};
