import { describe, it, expect } from 'vitest';
import { compareTracks, sortSongsByAlbum, OrderBy } from './SearchUtil';
import { Song } from './model.types';

const createSong = (partial: Partial<Song>): Song => ({
  id: 1,
  artist: 'Artist',
  title: 'Title',
  albumid: 1,
  albumpartid: null,
  bpm: 120,
  bpmlock: false,
  comments: null,
  curator: null,
  dateadded: '2023-01-01',
  dupeid: null,
  durationinms: 200000,
  energy: 5,
  featuring: null,
  filepath: '/path/song.mp3',
  googlesongid: null,
  lowquality: false,
  musicvideoid: null,
  rating: 5,
  remixer: null,
  resongid: null,
  search_text: null,
  spotifyid: null,
  tonickey: '8A',
  tonickeylock: false,
  track: '1',
  trashed: false,
  youtubeid: 'abc',
  youtubemusicid: null,
  ...partial,
});

describe('SearchUtil compareTracks', () => {
  it('correctly compares numerical track numbers where 10 is greater than 2-9', () => {
    expect(compareTracks('1', '2')).toBeLessThan(0);
    expect(compareTracks('2', '9')).toBeLessThan(0);
    expect(compareTracks('2', '10')).toBeLessThan(0);
    expect(compareTracks('9', '10')).toBeLessThan(0);
    expect(compareTracks('10', '2')).toBeGreaterThan(0);
    expect(compareTracks('10', '9')).toBeGreaterThan(0);
    expect(compareTracks('10', '11')).toBeLessThan(0);
    expect(compareTracks('10', '10')).toBe(0);
  });

  it('correctly compares letter track numbers (a, b, c)', () => {
    expect(compareTracks('a', 'b')).toBeLessThan(0);
    expect(compareTracks('b', 'c')).toBeLessThan(0);
    expect(compareTracks('c', 'a')).toBeGreaterThan(0);
    expect(compareTracks('A', 'B')).toBeLessThan(0);
    expect(compareTracks('A', 'a')).toBe(0);
  });

  it('correctly compares vinyl / alphanumeric track notations (A1, A2, A10, B1)', () => {
    expect(compareTracks('A1', 'A2')).toBeLessThan(0);
    expect(compareTracks('A2', 'A10')).toBeLessThan(0);
    expect(compareTracks('A10', 'B1')).toBeLessThan(0);
    expect(compareTracks('B1', 'A10')).toBeGreaterThan(0);
  });

  it('correctly compares disc/track notations (1-01, 1-02, 1-10, 2-01)', () => {
    expect(compareTracks('1-01', '1-02')).toBeLessThan(0);
    expect(compareTracks('1-02', '1-10')).toBeLessThan(0);
    expect(compareTracks('1-10', '2-01')).toBeLessThan(0);
  });

  it('correctly compares fraction track notations (1/12, 2/12, 10/12)', () => {
    expect(compareTracks('1/12', '2/12')).toBeLessThan(0);
    expect(compareTracks('2/12', '10/12')).toBeLessThan(0);
    expect(compareTracks('9/12', '10/12')).toBeLessThan(0);
    expect(compareTracks('10/12', '2/12')).toBeGreaterThan(0);
  });

  it('handles null, undefined, and empty string', () => {
    expect(compareTracks(null, null)).toBe(0);
    expect(compareTracks(undefined, undefined)).toBe(0);
    expect(compareTracks('', '')).toBe(0);
    expect(compareTracks('1', null)).toBeLessThan(0);
    expect(compareTracks(null, '1')).toBeGreaterThan(0);
    expect(compareTracks('1', '')).toBeLessThan(0);
    expect(compareTracks('', '1')).toBeGreaterThan(0);
  });
});

describe('SearchUtil sortSongsByAlbum', () => {
  it('orders numeric tracks 1 through 10 in natural ascending order', () => {
    const rawTrackList = ['1', '10', '2', '3', '4', '5', '6', '7', '8', '9'];
    const songs = rawTrackList.map((track, i) =>
      createSong({ id: i + 1, albumid: 100, track, title: `Track ${track}` })
    );

    const sorted = sortSongsByAlbum(songs);
    const sortedTracks = sorted.map((s) => s.track);

    expect(sortedTracks).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  it('orders letter tracks a through d in ascending order', () => {
    const rawTrackList = ['d', 'b', 'a', 'c'];
    const songs = rawTrackList.map((track, i) =>
      createSong({ id: i + 1, albumid: 100, track, title: `Track ${track}` })
    );

    const sorted = sortSongsByAlbum(songs);
    const sortedTracks = sorted.map((s) => s.track);

    expect(sortedTracks).toEqual(['a', 'b', 'c', 'd']);
  });

  it('groups by album ID descending, then albumpartid, then track', () => {
    const songs = [
      createSong({ id: 1, albumid: 10, albumpartid: 1, track: '10' }),
      createSong({ id: 2, albumid: 10, albumpartid: 1, track: '2' }),
      createSong({ id: 3, albumid: 20, albumpartid: 1, track: '1' }),
      createSong({ id: 4, albumid: 10, albumpartid: 2, track: '1' }),
    ];

    const sorted = sortSongsByAlbum(songs);

    expect(sorted.map((s) => s.id)).toEqual([
      3, // albumid 20
      2, // albumid 10, part 1, track 2
      1, // albumid 10, part 1, track 10
      4, // albumid 10, part 2, track 1
    ]);
  });
});
