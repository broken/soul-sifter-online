import { SupabaseClient } from "@supabase/supabase-js";

export interface JamBaseEventPerformer {
  identifier?: string;
  name?: string;
  url?: string;
}

export interface JamBaseEventLocation {
  name?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: {
      name?: string;
      alternateName?: string;
    } | string;
    postalCode?: string;
    addressCountry?: {
      name?: string;
      identifier?: string;
    } | string;
  };
  geo?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface JamBaseEventOffer {
  url?: string;
  seller?: string;
  priceSpecification?: {
    price?: number | string;
    priceCurrency?: string;
  };
}

export interface JamBaseEvent {
  id: string;
  name: string;
  eventStatus?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  isStreaming?: boolean;
  location?: JamBaseEventLocation;
  performer?: JamBaseEventPerformer[];
  offers?: JamBaseEventOffer[];
}

export interface JamBaseArtist {
  identifier: string;
  name: string;
  url?: string;
  image?: string;
  genre?: string[];
}

export interface JamBaseMetro {
  identifier: string;
  name: string;
  alternateName?: string;
  containedInPlace?: {
    name?: string;
    alternateName?: string;
  };
}

export interface JamBaseSettings {
  metroId: string;
  metroName: string;
  daysLimit: number;
}

export interface CachedArtistMapping {
  id: string;
  name: string;
  matchedAt: number;
  isManual?: boolean;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

const SETTINGS_KEY = 'soul_sifter_jambase_settings';
const ARTIST_MAPPINGS_KEY = 'soul_sifter_jambase_artists';
const EVENTS_CACHE_KEY = 'soul_sifter_jambase_events_cache';
const METROS_CACHE_KEY = 'soul_sifter_jambase_metros_cache';
const LIBRARY_ARTISTS_KEY = 'soul_sifter_library_artists';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const METROS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const LIBRARY_ARTISTS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const POPULAR_METROS: JamBaseMetro[] = [
  { identifier: 'jambase:3', name: 'Los Angeles, CA' },
  { identifier: 'jambase:11', name: 'Dallas / Fort Worth, TX' },
  { identifier: 'jambase:1', name: 'New York, NY' },
  { identifier: 'jambase:2', name: 'Chicago, IL' },
  { identifier: 'jambase:6', name: 'San Francisco Bay Area, CA' },
  { identifier: 'jambase:7', name: 'Austin, TX' },
  { identifier: 'jambase:8', name: 'Atlanta, GA' },
  { identifier: 'jambase:9', name: 'Seattle, WA' },
  { identifier: 'jambase:10', name: 'Nashville, TN' },
  { identifier: 'jambase:12', name: 'Boston, MA' },
  { identifier: 'jambase:13', name: 'Philadelphia, PA' },
  { identifier: 'jambase:14', name: 'Las Vegas, NV' },
  { identifier: 'jambase:15', name: 'Miami / Fort Lauderdale, FL' },
  { identifier: 'jambase:16', name: 'Washington, DC' },
  { identifier: 'jambase:17', name: 'Phoenix, AZ' },
  { identifier: 'jambase:18', name: 'Portland, OR' },
  { identifier: 'jambase:19', name: 'San Diego, CA' },
  { identifier: 'jambase:20', name: 'Denver, CO' },
  { identifier: 'jambase:21', name: 'Houston, TX' },
];

export const normalizeArtistName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents/diacritics
    .replace(/^the\s+/i, '') // strip leading "the "
    .replace(/[^\w\s]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
};

export class JamBaseService {
  private static baseUrl = 'https://api.data.jambase.com/v3';

  public static normalizeArtistName = normalizeArtistName;

  public static getApiKey(): string {
    return (import.meta.env.VITE_JAMBASE_API_KEY || '').trim();
  }

  // --- Settings ---
  public static getSettings(): JamBaseSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          metroId: parsed.metroId || 'jambase:3',
          metroName: parsed.metroName || 'Los Angeles, CA',
          daysLimit: parsed.daysLimit || 30,
        };
      }
    } catch (e) {
      console.error('Failed to load JamBase settings from localStorage:', e);
    }
    return {
      metroId: 'jambase:3',
      metroName: 'Los Angeles, CA',
      daysLimit: 30,
    };
  }

  public static saveSettings(settings: Partial<JamBaseSettings>): JamBaseSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save JamBase settings to localStorage:', e);
    }
    return updated;
  }

  // --- Metros Cache and Search ---
  public static async getMetros(): Promise<JamBaseMetro[]> {
    try {
      const stored = localStorage.getItem(METROS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < METROS_TTL_MS && Array.isArray(parsed.metros)) {
          return parsed.metros;
        }
      }
    } catch (e) {
      console.error('Failed to load metros from localStorage:', e);
    }

    try {
      const response = await this.request<{ success?: boolean; metros?: any[] }>('/geographies/metros', {
        metroHasUpcomingEvents: true,
      });

      if (response.metros && response.metros.length > 0) {
        const mapped: JamBaseMetro[] = response.metros.map((m) => ({
          identifier: m.identifier,
          name: m.name || m.alternateName,
          alternateName: m.alternateName,
        }));

        localStorage.setItem(
          METROS_CACHE_KEY,
          JSON.stringify({
            metros: mapped,
            timestamp: Date.now(),
          })
        );
        return mapped;
      }
    } catch (e) {
      console.warn('Could not fetch metros from JamBase API, falling back to popular presets:', e);
    }

    return POPULAR_METROS;
  }

  public static async searchCitiesOrMetros(query: string): Promise<JamBaseMetro[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return POPULAR_METROS;

    // Check cached/popular metros first
    const allMetros = await this.getMetros();
    const matches = allMetros.filter(
      (m) =>
        m.name.toLowerCase().includes(trimmed) ||
        (m.alternateName && m.alternateName.toLowerCase().includes(trimmed))
    );

    if (matches.length > 0) {
      return matches;
    }

    // Try searching cities endpoint
    try {
      const response = await this.request<{ success?: boolean; cities?: any[] }>('/geographies/cities', {
        geoCityName: query.trim(),
        cityHasUpcomingEvents: true,
      });

      if (response.cities && response.cities.length > 0) {
        const found: JamBaseMetro[] = [];
        for (const c of response.cities) {
          const metro = c.containedInPlace || c;
          const id = metro.identifier || c.identifier;
          if (id && !found.some((f) => f.identifier === id)) {
            const state = c.address?.addressRegion?.alternateName || c.address?.addressRegion?.name || '';
            found.push({
              identifier: id,
              name: `${c.name}${state ? ', ' + state : ''}`,
            });
          }
        }
        if (found.length > 0) return found;
      }
    } catch (e) {
      console.warn('City search query failed:', e);
    }

    return matches;
  }

  // --- Artist Mappings ---
  public static getArtistMappings(): Record<string, CachedArtistMapping> {
    try {
      const stored = localStorage.getItem(ARTIST_MAPPINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load JamBase artist mappings from localStorage:', e);
    }
    return {};
  }

  public static getArtistMapping(artistName: string): CachedArtistMapping | undefined {
    if (!artistName) return undefined;
    const mappings = this.getArtistMappings();
    return mappings[artistName.toLowerCase().trim()];
  }

  public static saveArtistMapping(artistName: string, id: string, displayName: string, isManual = false): void {
    if (!artistName || !id) return;
    const mappings = this.getArtistMappings();
    mappings[artistName.toLowerCase().trim()] = {
      id,
      name: displayName,
      matchedAt: Date.now(),
      isManual,
    };
    try {
      localStorage.setItem(ARTIST_MAPPINGS_KEY, JSON.stringify(mappings));
    } catch (e) {
      console.error('Failed to save artist mapping to localStorage:', e);
    }
  }

  public static removeArtistMapping(artistName: string): void {
    if (!artistName) return;
    const mappings = this.getArtistMappings();
    delete mappings[artistName.toLowerCase().trim()];
    try {
      localStorage.setItem(ARTIST_MAPPINGS_KEY, JSON.stringify(mappings));
    } catch (e) {
      console.error('Failed to delete artist mapping from localStorage:', e);
    }
  }

  // --- Library Artists Local Cache (0 frequent Supabase calls) ---
  public static async getLibraryArtists(supabaseClient?: SupabaseClient): Promise<string[]> {
    try {
      const stored = localStorage.getItem(LIBRARY_ARTISTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < LIBRARY_ARTISTS_TTL_MS && Array.isArray(parsed.artists)) {
          return parsed.artists;
        }
      }
    } catch (e) {
      console.error('Failed to read library artists from localStorage:', e);
    }

    if (!supabaseClient) {
      return Object.keys(this.getArtistMappings());
    }

    try {
      const { data, error } = await supabaseClient
        .from('songs')
        .select('artist')
        .not('artist', 'is', null)
        .limit(10000);

      if (error) throw error;
      if (data) {
        const unique = Array.from(
          new Set(
            data
              .map((d: any) => d.artist?.trim())
              .filter((a: any): a is string => Boolean(a && a.length > 0))
          )
        ).sort((a, b) => a.localeCompare(b));

        localStorage.setItem(
          LIBRARY_ARTISTS_KEY,
          JSON.stringify({
            artists: unique,
            timestamp: Date.now(),
          })
        );
        return unique;
      }
    } catch (e) {
      console.error('Error fetching library artists from Supabase:', e);
    }

    return Object.keys(this.getArtistMappings());
  }

  // --- Local Event Cache ---
  private static getCache(): Record<string, CacheEntry<any>> {
    try {
      const stored = localStorage.getItem(EVENTS_CACHE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load JamBase events cache from localStorage:', e);
    }
    return {};
  }

  private static getFromCache<T>(key: string): T | null {
    const cache = this.getCache();
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      delete cache[key];
      try {
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(cache));
      } catch (_) {}
      return null;
    }
    return entry.data as T;
  }

  private static setInCache<T>(key: string, data: T, ttlMs = CACHE_TTL_MS): void {
    const cache = this.getCache();
    cache[key] = {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    try {
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save to JamBase cache:', e);
    }
  }

  public static clearAllCache(): void {
    try {
      localStorage.removeItem(EVENTS_CACHE_KEY);
    } catch (e) {
      console.error('Failed to clear JamBase cache:', e);
    }
  }

  public static clearArtistEventCache(artistName: string): void {
    if (!artistName) return;
    const cache = this.getCache();
    const key = `artist:${artistName.toLowerCase().trim()}`;
    delete cache[key];
    try {
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to delete artist event cache:', e);
    }
  }

  // --- API Helpers ---
  private static async request<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | (string | number)[] | undefined>
  ): Promise<T> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('JamBase API key is missing. Please set VITE_JAMBASE_API_KEY in your .env file.');
    }

    const searchParams = new URLSearchParams();

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) {
          for (const item of v) {
            if (item !== undefined && item !== null && item !== '') {
              searchParams.append(k, String(item));
            }
          }
        } else {
          searchParams.set(k, String(v));
        }
      }
    }

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      let errorMsg = `JamBase API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.message) {
          errorMsg = errorJson.message;
        } else if (errorJson?.error) {
          errorMsg = String(errorJson.error);
        } else if (errorJson?.errors && Array.isArray(errorJson.errors)) {
          errorMsg = errorJson.errors.map((e: any) => e.message || e).join(', ');
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  // --- Search Artists for Manual Correction ---
  public static async searchArtists(query: string): Promise<JamBaseArtist[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const response = await this.request<{ success?: boolean; artists?: JamBaseArtist[] }>('/artists', {
        artistName: trimmed,
      });
      return response.artists || [];
    } catch (e) {
      console.error('Error searching JamBase artists:', e);
      throw e;
    }
  }

  // --- Resolve or Find Artist ID ---
  public static async resolveArtistId(artistName: string): Promise<{ id: string; name: string } | null> {
    const normalized = artistName.trim();
    if (!normalized) return null;

    // Check localStorage mapping first
    const mapped = this.getArtistMapping(normalized);
    if (mapped?.id) {
      return { id: mapped.id, name: mapped.name };
    }

    // Lookup on JamBase
    try {
      const artists = await this.searchArtists(normalized);
      if (artists.length > 0) {
        // Find exact or closest match
        const exact = artists.find((a) => a.name.toLowerCase() === normalized.toLowerCase()) || artists[0];
        this.saveArtistMapping(normalized, exact.identifier, exact.name, false);
        return { id: exact.identifier, name: exact.name };
      }
    } catch (e) {
      console.error(`Error resolving JamBase artist ID for "${normalized}":`, e);
      throw e;
    }

    return null;
  }

  // --- Fetch Events for a Single Artist ---
  public static async getArtistEvents(
    artistName: string,
    options?: {
      forceRefresh?: boolean;
      nearMetroId?: string;
      daysLimit?: number;
    }
  ): Promise<{ events: JamBaseEvent[]; artistId?: string; resolvedName?: string; fromCache: boolean }> {
    const normalized = artistName.trim();
    if (!normalized) {
      return { events: [], fromCache: false };
    }

    const cacheKey = `artist:${normalized.toLowerCase()}`;

    if (!options?.forceRefresh) {
      const cached = this.getFromCache<{ events: JamBaseEvent[]; artistId?: string; resolvedName?: string }>(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }

    // Resolve artist ID
    const resolved = await this.resolveArtistId(normalized);
    if (!resolved?.id) {
      // Cache empty result so we don't spam repeated lookups
      this.setInCache(cacheKey, { events: [], artistId: undefined, resolvedName: normalized }, 12 * 60 * 60 * 1000);
      return { events: [], resolvedName: normalized, fromCache: false };
    }

    // Query parameters
    const params: Record<string, string | number | boolean | (string | number)[] | undefined> = {
      artistId: resolved.id,
      perPage: 100,
    };

    if (options?.nearMetroId) {
      params.geoMetroId = options.nearMetroId;
    }

    if (options?.daysLimit) {
      const today = new Date();
      const future = new Date();
      future.setDate(today.getDate() + options.daysLimit);
      params.eventDateFrom = today.toISOString().split('T')[0];
      params.eventDateTo = future.toISOString().split('T')[0];
    }

    try {
      const response = await this.request<{ success?: boolean; events?: JamBaseEvent[] }>('/events', params);
      const events = response.events || [];

      // Sort by start date ascending
      events.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

      const result = {
        events,
        artistId: resolved.id,
        resolvedName: resolved.name,
      };

      this.setInCache(cacheKey, result);
      return { ...result, fromCache: false };
    } catch (e) {
      console.error(`Error fetching events for artist "${normalized}":`, e);
      throw e;
    }
  }

  // --- Fetch All Events in Metro (1 single call) ---
  public static async getMetroUpcomingEvents(options?: {
    forceRefresh?: boolean;
    metroId?: string;
    daysLimit?: number;
  }): Promise<{
    events: JamBaseEvent[];
    metroId: string;
    fromCache: boolean;
  }> {
    const settings = this.getSettings();
    const metroId = options?.metroId || settings.metroId || 'jambase:2';
    const daysLimit = options?.daysLimit || settings.daysLimit || 30;

    const cacheKey = `metro:${metroId}:${daysLimit}`;

    if (!options?.forceRefresh) {
      const cached = this.getFromCache<{ events: JamBaseEvent[] }>(cacheKey);
      if (cached) {
        return {
          events: cached.events,
          metroId,
          fromCache: true,
        };
      }
    }

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + daysLimit);

    const params: Record<string, string | number | boolean | (string | number)[] | undefined> = {
      geoMetroId: metroId,
      eventDateFrom: today.toISOString().split('T')[0],
      eventDateTo: future.toISOString().split('T')[0],
      perPage: 100,
    };

    try {
      const response = await this.request<{ success?: boolean; events?: JamBaseEvent[] }>('/events', params);
      const events = response.events || [];

      // Sort by start date ascending
      events.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

      this.setInCache(cacheKey, { events });

      return {
        events,
        metroId,
        fromCache: false,
      };
    } catch (e) {
      console.error(`Error fetching events for metro "${metroId}":`, e);
      throw e;
    }
  }
}
