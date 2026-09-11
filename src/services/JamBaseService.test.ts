import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JamBaseService, POPULAR_METROS, normalizeArtistName, extractArtistNames, cleanPerformerName } from './JamBaseService';

describe('JamBaseService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('normalizes artist names consistently for matching', () => {
    expect(normalizeArtistName('The Chemical Brothers')).toBe('chemical brothers');
    expect(normalizeArtistName('Chemical Brothers')).toBe('chemical brothers');
    expect(normalizeArtistName('Daft Punk!')).toBe('daft punk');
    expect(normalizeArtistName('  Above & Beyond  ')).toBe('above and beyond');
    expect(normalizeArtistName('Above and Beyond')).toBe('above and beyond');
    expect(normalizeArtistName('Beyoncé')).toBe('beyonce');
  });

  it('extracts collaboration and feature artist names', () => {
    const extracted1 = extractArtistNames('Above & Beyond feat. Richard Bedford');
    expect(extracted1).not.toContain('Above & Beyond feat. Richard Bedford');
    expect(extracted1).toContain('Above & Beyond');
    expect(extracted1).toContain('Richard Bedford');

    const extracted2 = extractArtistNames('deadmau5 & Kaskade');
    expect(extracted2).toContain('deadmau5 & Kaskade');

    const extracted3 = extractArtistNames('Eric Prydz vs. CHVRCHES');
    expect(extracted3).toContain('Eric Prydz vs. CHVRCHES');
    expect(extracted3).toContain('Eric Prydz');
    expect(extracted3).toContain('CHVRCHES');

    const extracted4 = extractArtistNames('Kaskade (DJ Set)');
    expect(extracted4).toContain('Kaskade');
  });

  it('cleans performer modifiers for exact matching', () => {
    const p1 = cleanPerformerName('Kaskade (DJ Set)');
    expect(p1).toContain('Kaskade');

    const p2 = cleanPerformerName('Eric Prydz - HOLO');
    expect(p2).toContain('Eric Prydz');

    const p3 = cleanPerformerName('deadmau5 (live)');
    expect(p3).toContain('deadmau5');

    const p4 = cleanPerformerName('Red Hot Chili Peppers');
    expect(p4).toEqual(['Red Hot Chili Peppers']);
  });

  it('manages settings in localStorage', () => {
    const initial = JamBaseService.getSettings();
    expect(initial.metroId).toBe('jambase:3');
    expect(initial.metroName).toBe('Los Angeles, CA');
    expect(initial.daysLimit).toBe(30);

    const saved = JamBaseService.saveSettings({
      metroId: 'jambase:11',
      metroName: 'Dallas / Fort Worth, TX',
      daysLimit: 60,
    });

    expect(saved.metroId).toBe('jambase:11');
    expect(saved.metroName).toBe('Dallas / Fort Worth, TX');
    expect(saved.daysLimit).toBe(60);

    const reloaded = JamBaseService.getSettings();
    expect(reloaded.metroId).toBe('jambase:11');
    expect(reloaded.metroName).toBe('Dallas / Fort Worth, TX');
    expect(reloaded.daysLimit).toBe(60);
  });

  it('searches metros by query matching popular presets', async () => {
    const dallasMatches = await JamBaseService.searchCitiesOrMetros('Dallas');
    expect(dallasMatches.length).toBeGreaterThan(0);
    expect(dallasMatches[0].identifier).toBe('jambase:11');
    expect(dallasMatches[0].name).toContain('Dallas');

    const laMatches = await JamBaseService.searchCitiesOrMetros('Los Angeles');
    expect(laMatches.length).toBeGreaterThan(0);
    expect(laMatches[0].identifier).toBe('jambase:3');
  });

  it('fetches upcoming events by geoMetroId and caches response', async () => {
    const mockEvents = [
      {
        id: 'event:la1',
        name: 'Daft Punk & Justice Live at Hollywood Bowl',
        startDate: '2026-10-15T20:00:00',
        location: { name: 'Hollywood Bowl', address: { addressLocality: 'Los Angeles' } },
        performer: [{ identifier: 'jambase:7600', name: 'Daft Punk' }],
      },
    ];

    vi.stubEnv('VITE_JAMBASE_API_KEY', 'test_key');

    const globalFetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, events: mockEvents }),
    } as Response);

    const result1 = await JamBaseService.getMetroUpcomingEvents({
      metroId: 'jambase:3',
      daysLimit: 30,
    });

    expect(result1.fromCache).toBe(false);
    expect(result1.events.length).toBe(1);
    expect(result1.events[0].name).toContain('Hollywood Bowl');
    expect(globalFetchSpy).toHaveBeenCalledTimes(1);

    const calledUrl = globalFetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('geoMetroId=jambase%3A3');

    // 2nd call should hit localStorage cache
    const result2 = await JamBaseService.getMetroUpcomingEvents({
      metroId: 'jambase:3',
      daysLimit: 30,
    });
    expect(result2.fromCache).toBe(true);
    expect(result2.events.length).toBe(1);
    expect(globalFetchSpy).toHaveBeenCalledTimes(1);
  });

  describe('isEventNearMetro', () => {
    it('correctly matches events in the selected metro using city and region', () => {
      // Los Angeles metro
      const laEvent = {
        id: '1',
        name: 'Concert at Hollywood Bowl',
        location: {
          name: 'Hollywood Bowl',
          address: { addressLocality: 'Los Angeles', addressRegion: 'CA' },
        },
      };
      const pasadenaEvent = {
        id: '2',
        name: 'Concert at Rose Bowl',
        location: {
          name: 'Rose Bowl',
          address: { addressLocality: 'Pasadena', addressRegion: { alternateName: 'CA' } },
        },
      };
      const sfEvent = {
        id: '3',
        name: 'Concert at Bill Graham',
        location: {
          name: 'Bill Graham Civic Auditorium',
          address: { addressLocality: 'San Francisco', addressRegion: 'CA' },
        },
      };
      const dallasEvent = {
        id: '4',
        name: 'Concert at Deep Ellum',
        location: {
          name: 'The Factory in Deep Ellum',
          address: { addressLocality: 'Dallas', addressRegion: 'TX' },
        },
      };

      expect(JamBaseService.isEventNearMetro(laEvent, 'jambase:3', 'Los Angeles, CA')).toBe(true);
      expect(JamBaseService.isEventNearMetro(pasadenaEvent, 'jambase:3', 'Los Angeles, CA')).toBe(true);
      // San Francisco should NOT match Los Angeles even though both are in CA
      expect(JamBaseService.isEventNearMetro(sfEvent, 'jambase:3', 'Los Angeles, CA')).toBe(false);
      // Dallas should NOT match Los Angeles
      expect(JamBaseService.isEventNearMetro(dallasEvent, 'jambase:3', 'Los Angeles, CA')).toBe(false);

      // Dallas metro
      expect(JamBaseService.isEventNearMetro(dallasEvent, 'jambase:11', 'Dallas / Fort Worth, TX')).toBe(true);
      expect(JamBaseService.isEventNearMetro(laEvent, 'jambase:11', 'Dallas / Fort Worth, TX')).toBe(false);
      expect(JamBaseService.isEventNearMetro(sfEvent, 'jambase:11', 'Dallas / Fort Worth, TX')).toBe(false);
    });

    it('correctly matches events using geo coordinates distance', () => {
      // Event in Anaheim (lat: 33.8003, lng: -117.8827) ~26 miles from LA center (34.0522, -118.2437)
      const anaheimEvent = {
        id: '5',
        name: 'Honda Center Show',
        location: {
          name: 'Honda Center',
          geo: { latitude: 33.8003, longitude: -117.8827 },
        },
      };
      // Event in San Francisco (lat: 37.7749, lng: -122.4194) ~350 miles from LA center
      const sfGeoEvent = {
        id: '6',
        name: 'SF Show',
        location: {
          name: 'SF Arena',
          geo: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      expect(JamBaseService.isEventNearMetro(anaheimEvent, 'jambase:3', 'Los Angeles, CA')).toBe(true);
      expect(JamBaseService.isEventNearMetro(sfGeoEvent, 'jambase:3', 'Los Angeles, CA')).toBe(false);
    });
  });
});
