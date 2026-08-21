import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ParentComponent, createSignal } from 'solid-js';
import ThemeContext from './ThemeContext';
import FontSizeContext from './FontSizeContext';
import AutoPlayContext, { autoPlayNext, setAutoPlayNext, autoPlayOnOpen, setAutoPlayOnOpen } from './AutoPlayContext';
import SongContext, { SongConsumer } from './SongContext';
import SongsContext, { useSongs } from './SongsContext';
import Settings from './Settings';
import SongPlayer from './SongPlayer';
import { Song } from '../model.types';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const supabaseBuilderMock: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockReturnThis(),
  };

  return {
    createClient: vi.fn(() => ({
      ...supabaseBuilderMock,
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
    })),
  };
});

const mockSongs: Song[] = [
  {
    id: 1,
    artist: "Artist One",
    title: "Track One",
    albumid: 1,
    albumpartid: null,
    bpm: 120,
    bpmlock: false,
    comments: null,
    curator: null,
    dateadded: "2023-01-01",
    dupeid: null,
    durationinms: 200000,
    energy: 5,
    featuring: null,
    filepath: "/music/1.mp3",
    googlesongid: null,
    lowquality: false,
    musicvideoid: null,
    rating: 5,
    remixer: null,
    resongid: null,
    search_text: null,
    spotifyid: null,
    tonickey: "1A",
    tonickeylock: false,
    track: "1",
    trashed: false,
    youtubeid: "yt_song_1",
    youtubemusicid: null,
  },
  {
    id: 2,
    artist: "Artist Two",
    title: "Track Two",
    albumid: 1,
    albumpartid: null,
    bpm: 124,
    bpmlock: false,
    comments: null,
    curator: null,
    dateadded: "2023-01-02",
    dupeid: null,
    durationinms: 240000,
    energy: 6,
    featuring: null,
    filepath: "/music/2.mp3",
    googlesongid: null,
    lowquality: false,
    musicvideoid: null,
    rating: 4,
    remixer: null,
    resongid: null,
    search_text: null,
    spotifyid: null,
    tonickey: "2A",
    tonickeylock: false,
    track: "2",
    trashed: false,
    youtubeid: "yt_song_2",
    youtubemusicid: null,
  },
  {
    id: 3,
    artist: "Artist Three",
    title: "Track Three",
    albumid: 1,
    albumpartid: null,
    bpm: 128,
    bpmlock: false,
    comments: null,
    curator: null,
    dateadded: "2023-01-03",
    dupeid: null,
    durationinms: 180000,
    energy: 7,
    featuring: null,
    filepath: "/music/3.mp3",
    googlesongid: null,
    lowquality: false,
    musicvideoid: null,
    rating: 5,
    remixer: null,
    resongid: null,
    search_text: null,
    spotifyid: null,
    tonickey: "3A",
    tonickeylock: false,
    track: "3",
    trashed: false,
    youtubeid: "yt_song_3",
    youtubemusicid: null,
  },
];

const TestSettingsApp: ParentComponent = (props) => {
  return (
    <ThemeContext>
      <FontSizeContext>
        <AutoPlayContext>
          {props.children}
        </AutoPlayContext>
      </FontSizeContext>
    </ThemeContext>
  );
};

describe('Auto-Play Settings Functionality', () => {
  beforeEach(() => {
    setAutoPlayNext(false);
    setAutoPlayOnOpen(false);
  });

  it('should initialize with auto-play disabled by default', () => {
    expect(autoPlayNext()).toBe(false);
    expect(autoPlayOnOpen()).toBe(false);
  });

  it('should render the auto-play next toggle and allow switching it on/off in Settings', async () => {
    const { unmount } = render(() => (
      <TestSettingsApp>
        <Settings />
      </TestSettingsApp>
    ));

    const toggle = screen.getByRole('checkbox', { name: /auto-play next song/i }) as HTMLInputElement;
    expect(toggle).toBeInTheDocument();
    expect(toggle.checked).toBe(false);

    // Toggle on
    fireEvent.click(toggle);
    expect(autoPlayNext()).toBe(true);
    expect(window.localStorage.getItem('autoPlayNext')).toBe('true');
    expect(toggle.checked).toBe(true);

    // Toggle off
    fireEvent.click(toggle);
    expect(autoPlayNext()).toBe(false);
    expect(window.localStorage.getItem('autoPlayNext')).toBe('false');
    expect(toggle.checked).toBe(false);

    unmount();
  });

  it('should render the auto-play on open toggle and allow switching it on/off in Settings', async () => {
    const { unmount } = render(() => (
      <TestSettingsApp>
        <Settings />
      </TestSettingsApp>
    ));

    const toggle = screen.getByRole('checkbox', { name: /auto-play on song info open/i }) as HTMLInputElement;
    expect(toggle).toBeInTheDocument();
    expect(toggle.checked).toBe(false);

    // Toggle on
    fireEvent.click(toggle);
    expect(autoPlayOnOpen()).toBe(true);
    expect(window.localStorage.getItem('autoPlayOnOpen')).toBe('true');
    expect(toggle.checked).toBe(true);

    // Toggle off
    fireEvent.click(toggle);
    expect(autoPlayOnOpen()).toBe(false);
    expect(window.localStorage.getItem('autoPlayOnOpen')).toBe('false');
    expect(toggle.checked).toBe(false);

    unmount();
  });

  it('should persist autoplay settings in localStorage when setters are called directly', () => {
    setAutoPlayNext(true);
    expect(window.localStorage.getItem('autoPlayNext')).toBe('true');

    setAutoPlayNext(false);
    expect(window.localStorage.getItem('autoPlayNext')).toBe('false');

    setAutoPlayOnOpen(true);
    expect(window.localStorage.getItem('autoPlayOnOpen')).toBe('true');

    setAutoPlayOnOpen(false);
    expect(window.localStorage.getItem('autoPlayOnOpen')).toBe('false');
  });
});

describe('Auto-Play Playback Behavior', () => {
  let playerEvents: Record<string, Function> = {};
  let mockPlayerInstance: any;

  beforeEach(() => {
    setAutoPlayNext(false);
    setAutoPlayOnOpen(false);
    const { setSong } = SongConsumer();
    setSong(undefined);
    playerEvents = {};
    mockPlayerInstance = {
      playVideo: vi.fn(() => {
        if (playerEvents.onStateChange) {
          playerEvents.onStateChange({ data: 1 }); // PLAYING
        }
      }),
      pauseVideo: vi.fn(() => {
        if (playerEvents.onStateChange) {
          playerEvents.onStateChange({ data: 2 }); // PAUSED
        }
      }),
      stopVideo: vi.fn(),
      seekTo: vi.fn(),
      destroy: vi.fn(),
      getCurrentTime: vi.fn().mockReturnValue(0),
      getDuration: vi.fn().mockReturnValue(200),
    };

    window.YT = {
      Player: vi.fn().mockImplementation((element: any, config: any) => {
        playerEvents = config.events || {};
        if (playerEvents.onReady) {
          playerEvents.onReady({
            target: mockPlayerInstance,
          });
        }
        return mockPlayerInstance;
      }),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const PlaybackTestHarness: ParentComponent = () => {
    const { song, setSong } = SongConsumer();
    const { setSongs } = useSongs();

    // Populate songs list and select first song
    setSongs(mockSongs);
    if (!song()) {
      setSong(mockSongs[0]);
    }

    return <SongPlayer song={song()} />;
  };

  it('does not advance to the next song when playback completes if auto-play is disabled', async () => {
    setAutoPlayNext(false);

    const { unmount } = render(() => (
      <SongContext>
        <SongsContext>
          <AutoPlayContext>
            <PlaybackTestHarness />
          </AutoPlayContext>
        </SongsContext>
      </SongContext>
    ));

    await screen.findByRole('button', { name: /play/i });

    // Initial player created for Track One (yt_song_1)
    expect(window.YT.Player).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ videoId: "yt_song_1" })
    );

    // Simulate song completion (state === 0)
    playerEvents.onStateChange({ data: 0 });

    // Should NOT have initialized a second player for Track Two
    expect(window.YT.Player).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('automatically advances to and plays the next song when playback completes if auto-play is enabled', async () => {
    setAutoPlayNext(true);

    const { unmount } = render(() => (
      <SongContext>
        <SongsContext>
          <AutoPlayContext>
            <PlaybackTestHarness />
          </AutoPlayContext>
        </SongsContext>
      </SongContext>
    ));

    await screen.findByRole('button', { name: /play/i });

    // Initial player created for Track One (yt_song_1)
    expect(window.YT.Player).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ videoId: "yt_song_1" })
    );

    // Simulate song 1 completion (state === 0)
    playerEvents.onStateChange({ data: 0 });

    // Wait for the next song (Track Two, yt_song_2) to be loaded with autoplay
    await waitFor(() => {
      expect(window.YT.Player).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          videoId: "yt_song_2",
          playerVars: expect.objectContaining({ autoplay: 1 }),
        })
      );
    });

    expect(mockPlayerInstance.playVideo).toHaveBeenCalled();

    unmount();
  });

  it('stops without error when the last song in the list completes playback', async () => {
    setAutoPlayNext(true);

    const EndOfListHarness: ParentComponent = () => {
      const { song, setSong } = SongConsumer();
      const { setSongs } = useSongs();

      setSongs(mockSongs);
      if (!song() || song()?.id !== 3) {
        setSong(mockSongs[2]); // Last song in mockSongs
      }

      return <SongPlayer song={song()} />;
    };

    const { unmount } = render(() => (
      <SongContext>
        <SongsContext>
          <AutoPlayContext>
            <EndOfListHarness />
          </AutoPlayContext>
        </SongsContext>
      </SongContext>
    ));

    await screen.findByRole('button', { name: /play/i });

    expect(window.YT.Player).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ videoId: "yt_song_3" })
    );

    // Trigger ENDED on last song
    playerEvents.onStateChange({ data: 0 });

    // No next song available, so Player is not called again
    expect(window.YT.Player).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('triggers onAutoPlayNext callback when provided upon song playback completion', async () => {
    setAutoPlayNext(true);
    const mockOnAutoPlayNext = vi.fn();

    const CallbackTestHarness: ParentComponent = () => {
      const { song, setSong } = SongConsumer();
      const { setSongs } = useSongs();

      setSongs(mockSongs);
      if (!song()) {
        setSong(mockSongs[0]);
      }

      return <SongPlayer song={song()} onAutoPlayNext={mockOnAutoPlayNext} />;
    };

    const { unmount } = render(() => (
      <SongContext>
        <SongsContext>
          <AutoPlayContext>
            <CallbackTestHarness />
          </AutoPlayContext>
        </SongsContext>
      </SongContext>
    ));

    await screen.findByRole('button', { name: /play/i });

    // Trigger ENDED on song 1
    playerEvents.onStateChange({ data: 0 });

    expect(mockOnAutoPlayNext).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('does not auto-play when song info is opened if autoPlayOnOpen is disabled', async () => {
    setAutoPlayOnOpen(false);

    const { unmount } = render(() => (
      <SongContext>
        <SongsContext>
          <AutoPlayContext>
            <PlaybackTestHarness />
          </AutoPlayContext>
        </SongsContext>
      </SongContext>
    ));

    await screen.findByRole('button', { name: /play/i });

    expect(window.YT.Player).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        videoId: "yt_song_1",
        playerVars: expect.objectContaining({ autoplay: 0 }),
      })
    );
    expect(mockPlayerInstance.playVideo).not.toHaveBeenCalled();

    unmount();
  });

  it('automatically plays song when song info is opened if autoPlayOnOpen is enabled', async () => {
    setAutoPlayOnOpen(true);

    const { unmount } = render(() => (
      <SongContext>
        <SongsContext>
          <AutoPlayContext>
            <PlaybackTestHarness />
          </AutoPlayContext>
        </SongsContext>
      </SongContext>
    ));

    await waitFor(() => {
      expect(window.YT.Player).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          videoId: "yt_song_1",
          playerVars: expect.objectContaining({ autoplay: 1 }),
        })
      );
    });

    expect(mockPlayerInstance.playVideo).toHaveBeenCalled();

    unmount();
  });
});
