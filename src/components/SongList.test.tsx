import { render, screen, waitFor, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignal } from 'solid-js';
import '@testing-library/jest-dom/vitest';

import SongList from './SongList';
import { OrderBy } from '../SearchUtil';
import { Playlist, Song } from '../model.types';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

const mockSearchSongs = vi.fn();
vi.mock('../SearchUtil', () => ({
  searchSongs: (...args: any[]) => mockSearchSongs(...args),
  OrderBy: {
    DATE_ADDED: 0,
    RELEASE_DATE: 1,
    RANDOM: 2,
    BPM: 3,
    ALBUM: 4,
    PLAYLIST: 5,
  },
}));

let mockActiveGenres: any[] = [];
const mockSetActiveGenres = vi.fn((genres) => { mockActiveGenres = genres; });
vi.mock('./GenresContext', () => ({
  useGenres: () => ({
    activeGenres: () => mockActiveGenres,
    setActiveGenres: mockSetActiveGenres,
  }),
}));

let mockActivePlaylist: Playlist | undefined = undefined;
const mockSetActivePlaylist = vi.fn((pl) => { mockActivePlaylist = pl; });
vi.mock('./PlaylistContext', () => ({
  useActivePlaylist: () => ({
    activePlaylist: () => mockActivePlaylist,
    setActivePlaylist: mockSetActivePlaylist,
  }),
}));

let mockSearchQuery = '';
vi.mock('./SearchToolbar', () => ({
  debouncedSearchQuery: () => mockSearchQuery,
}));

let mockSongs: Song[] = [];
const mockSetSongs = vi.fn((songs) => {
  if (typeof songs === 'function') {
    mockSongs = songs(mockSongs);
  } else {
    mockSongs = songs;
  }
});
vi.mock('./SongsContext', () => ({
  useSongs: () => ({
    songs: mockSongs,
    setSongs: mockSetSongs,
  }),
}));

vi.mock('./SongListItem', () => ({
  default: (props: { song: Song }) => (
    <tr data-testid={`song-item-${props.song.id}`}>
      <td>{props.song.title}</td>
    </tr>
  ),
}));

describe('SongList query-based playlists and normal playlists', () => {
  const dummySong: Song = {
    id: 1,
    artist: 'Test Artist',
    title: 'Test Title',
    albumid: 1,
    albumpartid: null,
    bpm: 128,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveGenres = [];
    mockActivePlaylist = undefined;
    mockSearchQuery = '';
    mockSongs = [];
    mockSearchSongs.mockResolvedValue([dummySong]);
  });

  it('searches songs with empty playlistIds and DATE_ADDED order when no playlist is active', async () => {
    render(() => <SongList />);

    await waitFor(() => {
      expect(mockSearchSongs).toHaveBeenCalled();
    });

    // Arguments: query, limit, bpm, key, styles, songsToOmit, playlists, energy, offset, orderBy, errorCallback
    expect(mockSearchSongs).toHaveBeenCalledWith(
      '',
      expect.any(Number),
      0,
      '',
      [],
      [],
      [], // playlistIds
      0,
      0,
      OrderBy.DATE_ADDED,
      undefined
    );
  });

  it('searches songs with playlist id and PLAYLIST order when a standard playlist is active', async () => {
    mockActivePlaylist = {
      id: 42,
      name: 'Standard Playlist',
      query: null,
      gmusicid: null,
      spotifyid: null,
      youtubeid: null,
    };

    render(() => <SongList />);

    await waitFor(() => {
      expect(mockSearchSongs).toHaveBeenCalled();
    });

    expect(mockSearchSongs).toHaveBeenCalledWith(
      '',
      expect.any(Number),
      0,
      '',
      [],
      [],
      [42], // playlistIds
      0,
      0,
      OrderBy.PLAYLIST,
      undefined
    );
    expect(screen.getByText('Playlist Standard Playlist.')).toBeInTheDocument();
  });

  it('searches songs with playlist query, empty playlistIds, and DATE_ADDED order for query-based playlists', async () => {
    mockActivePlaylist = {
      id: 99,
      name: 'Query Playlist',
      query: 'bpm:>125 e:6',
      gmusicid: null,
      spotifyid: null,
      youtubeid: null,
    };

    render(() => <SongList />);

    await waitFor(() => {
      expect(mockSearchSongs).toHaveBeenCalled();
    });

    expect(mockSearchSongs).toHaveBeenCalledWith(
      'bpm:>125 e:6',
      expect.any(Number),
      0,
      '',
      [],
      [],
      [], // playlistIds should be empty for query-based playlist
      0,
      0,
      OrderBy.DATE_ADDED,
      undefined
    );
    expect(screen.getByText('Playlist Query Playlist.')).toBeInTheDocument();
  });

  it('combines playlist query and search query when searching in a query-based playlist', async () => {
    mockActivePlaylist = {
      id: 99,
      name: 'Query Playlist',
      query: 'bpm:>125',
      gmusicid: null,
      spotifyid: null,
      youtubeid: null,
    };
    mockSearchQuery = 'Daft Punk';

    render(() => <SongList />);

    await waitFor(() => {
      expect(mockSearchSongs).toHaveBeenCalled();
    });

    expect(mockSearchSongs).toHaveBeenCalledWith(
      'bpm:>125 Daft Punk',
      expect.any(Number),
      0,
      '',
      [],
      [],
      [], // playlistIds should be empty
      0,
      0,
      OrderBy.DATE_ADDED,
      undefined
    );
  });
});
