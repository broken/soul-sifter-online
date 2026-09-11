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

export interface MetroGeoInfo {
  identifier: string;
  name: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  stateCodes: string[];
  cities: string[];
}

export const METRO_GEO_DATA: Record<string, MetroGeoInfo> = {
  'jambase:3': {
    identifier: 'jambase:3',
    name: 'Los Angeles, CA',
    lat: 34.0522,
    lng: -118.2437,
    radiusMiles: 65,
    stateCodes: ['ca', 'california'],
    cities: [
      'los angeles', 'la', 'hollywood', 'west hollywood', 'north hollywood',
      'beverly hills', 'santa monica', 'pasadena', 'inglewood', 'anaheim',
      'costa mesa', 'long beach', 'irvine', 'burbank', 'glendale', 'pomona',
      'ontario', 'riverside', 'orange', 'fullerton', 'torrance', 'santa ana',
      'huntington beach', 'newport beach', 'downey', 'culver city', 'el segundo',
      'thousand oaks', 'westwood', 'san bernardino', 'chino'
    ],
  },
  'jambase:11': {
    identifier: 'jambase:11',
    name: 'Dallas / Fort Worth, TX',
    lat: 32.7767,
    lng: -96.7970,
    radiusMiles: 65,
    stateCodes: ['tx', 'texas'],
    cities: [
      'dallas', 'fort worth', 'ft worth', 'ft. worth', 'arlington', 'irving',
      'plano', 'frisco', 'garland', 'denton', 'grand prairie', 'mckinney',
      'richardson', 'carrollton', 'lewisville', 'grapevine', 'mesquite',
      'bedford', 'euless', 'hurst', 'allen', 'addison'
    ],
  },
  'jambase:1': {
    identifier: 'jambase:1',
    name: 'New York, NY',
    lat: 40.7128,
    lng: -74.0060,
    radiusMiles: 45,
    stateCodes: ['ny', 'new york', 'nj', 'new jersey'],
    cities: [
      'new york', 'nyc', 'brooklyn', 'manhattan', 'queens', 'bronx',
      'staten island', 'jersey city', 'hoboken', 'newark', 'yonkers',
      'white plains', 'paramus', 'montclair', 'asbury park', 'port chester'
    ],
  },
  'jambase:2': {
    identifier: 'jambase:2',
    name: 'Chicago, IL',
    lat: 41.8781,
    lng: -87.6298,
    radiusMiles: 50,
    stateCodes: ['il', 'illinois', 'in', 'indiana'],
    cities: [
      'chicago', 'evanston', 'rosemont', 'naperville', 'aurora', 'joliet',
      'elgin', 'gary', 'oak park', 'schaumburg', 'tinley park', 'highland park'
    ],
  },
  'jambase:6': {
    identifier: 'jambase:6',
    name: 'San Francisco Bay Area, CA',
    lat: 37.7749,
    lng: -122.4194,
    radiusMiles: 60,
    stateCodes: ['ca', 'california'],
    cities: [
      'san francisco', 'sf', 'oakland', 'berkeley', 'san jose', 'palo alto',
      'mountain view', 'santa clara', 'sunnyvale', 'fremont', 'hayward',
      'richmond', 'concord', 'san mateo', 'mill valley', 'san rafael',
      'walnut creek', 'napa', 'santa cruz'
    ],
  },
  'jambase:7': {
    identifier: 'jambase:7',
    name: 'Austin, TX',
    lat: 30.2672,
    lng: -97.7431,
    radiusMiles: 40,
    stateCodes: ['tx', 'texas'],
    cities: ['austin', 'round rock', 'cedar park', 'pflugerville', 'georgetown', 'san marcos', 'kyle', 'buda', 'bastrop'],
  },
  'jambase:8': {
    identifier: 'jambase:8',
    name: 'Atlanta, GA',
    lat: 33.7490,
    lng: -84.3880,
    radiusMiles: 45,
    stateCodes: ['ga', 'georgia'],
    cities: ['atlanta', 'marietta', 'alpharetta', 'roswell', 'sandy springs', 'duluth', 'decatur', 'lawrenceville', 'kennesaw', 'smyrna'],
  },
  'jambase:9': {
    identifier: 'jambase:9',
    name: 'Seattle, WA',
    lat: 47.6062,
    lng: -122.3321,
    radiusMiles: 45,
    stateCodes: ['wa', 'washington'],
    cities: ['seattle', 'tacoma', 'bellevue', 'redmond', 'kirkland', 'everett', 'renton', 'kent', 'auburn', 'olympia'],
  },
  'jambase:10': {
    identifier: 'jambase:10',
    name: 'Nashville, TN',
    lat: 36.1627,
    lng: -86.7816,
    radiusMiles: 40,
    stateCodes: ['tn', 'tennessee'],
    cities: ['nashville', 'franklin', 'brentwood', 'murfreesboro', 'hendersonville', 'mt. juliet', 'mount juliet', 'lebanon', 'gallatin'],
  },
  'jambase:12': {
    identifier: 'jambase:12',
    name: 'Boston, MA',
    lat: 42.3601,
    lng: -71.0589,
    radiusMiles: 40,
    stateCodes: ['ma', 'massachusetts'],
    cities: ['boston', 'cambridge', 'somerville', 'brighton', 'allston', 'brookline', 'quincy', 'medford', 'newton', 'salem', 'worcester', 'foxborough'],
  },
  'jambase:13': {
    identifier: 'jambase:13',
    name: 'Philadelphia, PA',
    lat: 39.9526,
    lng: -75.1652,
    radiusMiles: 45,
    stateCodes: ['pa', 'pennsylvania', 'nj', 'new jersey', 'de', 'delaware'],
    cities: ['philadelphia', 'camden', 'chester', 'norristown', 'king of prussia', 'conshohocken', 'upper darby', 'wilmington', 'cherry hill', 'atlantic city'],
  },
  'jambase:14': {
    identifier: 'jambase:14',
    name: 'Las Vegas, NV',
    lat: 36.1699,
    lng: -115.1398,
    radiusMiles: 40,
    stateCodes: ['nv', 'nevada'],
    cities: ['las vegas', 'henderson', 'north las vegas', 'paradise', 'spring valley', 'boulder city'],
  },
  'jambase:15': {
    identifier: 'jambase:15',
    name: 'Miami / Fort Lauderdale, FL',
    lat: 25.7617,
    lng: -80.1918,
    radiusMiles: 55,
    stateCodes: ['fl', 'florida'],
    cities: ['miami', 'miami beach', 'fort lauderdale', 'ft lauderdale', 'ft. lauderdale', 'hollywood', 'pompano beach', 'boca raton', 'west palm beach', 'coral gables', 'hialeah', 'sunrise', 'davie'],
  },
  'jambase:16': {
    identifier: 'jambase:16',
    name: 'Washington, DC',
    lat: 38.9072,
    lng: -77.0369,
    radiusMiles: 45,
    stateCodes: ['dc', 'district of columbia', 'md', 'maryland', 'va', 'virginia'],
    cities: ['washington', 'alexandria', 'arlington', 'bethesda', 'silver spring', 'rockville', 'fairfax', 'falls church', 'vienna', 'reston', 'columbia'],
  },
  'jambase:17': {
    identifier: 'jambase:17',
    name: 'Phoenix, AZ',
    lat: 33.4484,
    lng: -112.0740,
    radiusMiles: 45,
    stateCodes: ['az', 'arizona'],
    cities: ['phoenix', 'scottsdale', 'tempe', 'mesa', 'chandler', 'glendale', 'gilbert', 'peoria', 'surprise'],
  },
  'jambase:18': {
    identifier: 'jambase:18',
    name: 'Portland, OR',
    lat: 45.5152,
    lng: -122.6784,
    radiusMiles: 40,
    stateCodes: ['or', 'oregon', 'wa', 'washington'],
    cities: ['portland', 'beaverton', 'hillsboro', 'gresham', 'tigard', 'lake oswego', 'vancouver'],
  },
  'jambase:19': {
    identifier: 'jambase:19',
    name: 'San Diego, CA',
    lat: 32.7157,
    lng: -117.1611,
    radiusMiles: 40,
    stateCodes: ['ca', 'california'],
    cities: ['san diego', 'chula vista', 'oceanside', 'escondido', 'carlsbad', 'el cajon', 'encinitas', 'la jolla', 'del mar', 'solana beach', 'coronado'],
  },
  'jambase:20': {
    identifier: 'jambase:20',
    name: 'Denver, CO',
    lat: 39.7392,
    lng: -104.9903,
    radiusMiles: 45,
    stateCodes: ['co', 'colorado'],
    cities: ['denver', 'boulder', 'aurora', 'lakewood', 'littleton', 'englewood', 'arvada', 'westminster', 'centennial', 'red rocks', 'morrison'],
  },
  'jambase:21': {
    identifier: 'jambase:21',
    name: 'Houston, TX',
    lat: 29.7604,
    lng: -95.3698,
    radiusMiles: 45,
    stateCodes: ['tx', 'texas'],
    cities: ['houston', 'woodlands', 'the woodlands', 'sugar land', 'katy', 'pasadena', 'pearland', 'spring', 'conroe', 'cypress'],
  },
};

export const normalizeArtistName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents/diacritics
    .replace(/^the\s+/i, '') // strip leading "the "
    .replace(/\s*&\s*/g, ' and ') // unify & and "and"
    .replace(/[^\w\s]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
};

export const extractArtistNames = (raw: string): string[] => {
  if (!raw) return [];
  const results = new Set<string>();

  const isFeature = /\b(?:feat\.?|ft\.?|featuring)\b/i.test(raw);

  // Extract from parenthetical / bracket info like (feat. XYZ) or (DJ Set)
  const cleaned = raw
    .replace(/\s*\(([^)]*)\)/g, (_, inner) => {
      const cleanedInner = inner.replace(/^(feat\.?|ft\.?|with)\s+/i, '').trim();
      if (cleanedInner && cleanedInner.length >= 2 && !/^(dj set|live|remix|club mix|original mix|vip)$/i.test(cleanedInner)) {
        results.add(cleanedInner);
      }
      return ' ';
    })
    .replace(/\s*\[([^\]]*)\]/g, (_, inner) => {
      const cleanedInner = inner.replace(/^(feat\.?|ft\.?|with)\s+/i, '').trim();
      if (cleanedInner && cleanedInner.length >= 2 && !/^(dj set|live|remix|club mix|original mix|vip)$/i.test(cleanedInner)) {
        results.add(cleanedInner);
      }
      return ' ';
    });

  // Only add whole string if it doesn't contain a feature credit
  const trimmed = raw.trim();
  if (trimmed && !isFeature) {
    results.add(trimmed);
  }

  const baseCleaned = cleaned.trim();
  if (baseCleaned && !isFeature) {
    results.add(baseCleaned);
  }

  // Split on feature/collaboration separators (feat., ft., pres., vs., with, etc.)
  const featParts = baseCleaned.split(/\s+(?:feat\.?|ft\.?|featuring|pres\.?|presents|vs\.?|vs|with|w\/)\s+/i);
  for (const part of featParts) {
    const partTrimmed = part.trim();
    if (partTrimmed.length >= 2) {
      results.add(partTrimmed);
      // Split sub-parts on " x ", "/", ",", "+"
      const subParts = partTrimmed.split(/\s+x\s+|\s*\/\s*|\s*,\s*|\s*\+\s*/i);
      if (subParts.length > 1) {
        for (const sp of subParts) {
          const spTrimmed = sp.trim();
          if (spTrimmed.length >= 2) {
            results.add(spTrimmed);
          }
        }
      }
    }
  }

  return Array.from(results);
};

export function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class JamBaseService {
  private static baseUrl = 'https://api.data.jambase.com/v3';

  public static normalizeArtistName = normalizeArtistName;

  public static isEventNearMetro(event: JamBaseEvent, metroId?: string, metroName?: string): boolean {
    const targetMetroId = metroId || this.getSettings().metroId;
    const targetMetroName = metroName || this.getSettings().metroName;
    const geoInfo = targetMetroId ? METRO_GEO_DATA[targetMetroId] : undefined;

    // 1. Precise Coordinate Distance check if event has geo coordinates
    const eventLat = event.location?.geo?.latitude;
    const eventLng = event.location?.geo?.longitude;

    if (geoInfo && typeof eventLat === 'number' && typeof eventLng === 'number' && !isNaN(eventLat) && !isNaN(eventLng)) {
      const distance = haversineDistanceMiles(geoInfo.lat, geoInfo.lng, eventLat, eventLng);
      return distance <= geoInfo.radiusMiles;
    }

    // 2. City & State Text Matching
    const loc = event.location;
    if (!loc) return false;

    const eventCity = (loc.address?.addressLocality || '').toLowerCase().trim();
    const eventRegion = typeof loc.address?.addressRegion === 'object'
      ? (loc.address.addressRegion?.alternateName || loc.address.addressRegion?.name || '').toLowerCase().trim()
      : (loc.address?.addressRegion || '').toLowerCase().trim();
    const venueName = (loc.name || '').toLowerCase().trim();

    if (geoInfo) {
      // Check region / state: Event MUST match one of the metro's valid state codes
      if (eventRegion && !geoInfo.stateCodes.includes(eventRegion)) {
        return false;
      }

      // Check city name: must match one of the metro's known cities or venue contains known city
      if (eventCity) {
        const exactCityMatch = geoInfo.cities.some(
          (c) => c === eventCity || eventCity.startsWith(c + ' ') || eventCity.endsWith(' ' + c)
        );
        if (exactCityMatch) return true;
      }

      if (venueName) {
        const venueCityMatch = geoInfo.cities.some((c) => {
          if (c.length < 4) return false; // avoid false matches on short abbreviations
          const regex = new RegExp(`(^|\\s)${c}(\\s|$)`, 'i');
          return regex.test(venueName);
        });
        if (venueCityMatch) return true;
      }

      return false;
    }

    // Fallback for custom / unlisted metros: parse "City, ST" format
    const nameLower = (targetMetroName || '').toLowerCase().trim();
    const parts = nameLower.split(',').map((p) => p.trim());
    const targetCityPart = parts[0] || '';
    const targetStatePart = parts[1] || '';

    // If state was specified, eventRegion must match
    if (targetStatePart && eventRegion && !eventRegion.includes(targetStatePart) && !targetStatePart.includes(eventRegion)) {
      return false;
    }

    // Match city tokens (strictly whole words, min length 3)
    const cityTokens = targetCityPart
      .split(/[\s/]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);

    if (cityTokens.length > 0 && eventCity) {
      return cityTokens.some((tok) => eventCity.includes(tok));
    }

    return false;
  }

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
  public static async getLibraryArtists(supabaseClient?: SupabaseClient, forceRefresh = false): Promise<string[]> {
    if (!forceRefresh) {
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
    }

    if (!supabaseClient) {
      return Object.keys(this.getArtistMappings());
    }

    try {
      const allArtists: string[] = [];
      let offset = 0;
      const pageSize = 1000;

      // 1. Paginate through songs to avoid truncation by PostgREST row limits
      while (true) {
        const { data, error } = await supabaseClient
          .from('songs')
          .select('artist, remixer')
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.warn('Error querying songs page for artists:', error);
          break;
        }
        if (!data || data.length === 0) break;

        for (const row of data) {
          if (row.artist) {
            for (const name of extractArtistNames(row.artist)) {
              allArtists.push(name);
            }
          }
          if (row.remixer) {
            for (const name of extractArtistNames(row.remixer)) {
              allArtists.push(name);
            }
          }
        }

        if (data.length < pageSize) break;
        offset += pageSize;
      }

      // 2. Fetch album artists
      try {
        const { data: albumData } = await supabaseClient
          .from('albums')
          .select('artist')
          .not('artist', 'is', null)
          .limit(5000);

        if (albumData) {
          for (const row of albumData) {
            if (row.artist) {
              for (const name of extractArtistNames(row.artist)) {
                allArtists.push(name);
              }
            }
          }
        }
      } catch (_) {}

      // 3. Include mapped artists from localStorage
      const mappings = this.getArtistMappings();
      for (const m of Object.values(mappings)) {
        if (m.name) allArtists.push(m.name);
      }

      const unique = Array.from(new Set(allArtists.filter((a) => a && a.trim().length > 0))).sort((a, b) =>
        a.localeCompare(b)
      );

      localStorage.setItem(
        LIBRARY_ARTISTS_KEY,
        JSON.stringify({
          artists: unique,
          timestamp: Date.now(),
        })
      );
      return unique;
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
