import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JamBaseService, POPULAR_METROS, normalizeArtistName } from './JamBaseService';

describe('JamBaseService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('normalizes artist names consistently for matching', () => {
    expect(normalizeArtistName('The Chemical Brothers')).toBe('chemical brothers');
    expect(normalizeArtistName('Chemical Brothers')).toBe('chemical brothers');
    expect(normalizeArtistName('Daft Punk!')).toBe('daft punk');
    expect(normalizeArtistName('  Above & Beyond  ')).toBe('above beyond');
    expect(normalizeArtistName('Beyoncé')).toBe('beyonce');
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
});
