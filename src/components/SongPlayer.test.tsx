import { render, fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import '@testing-library/jest-dom/vitest';
import { createSignal } from "solid-js";
import SongPlayer from "./SongPlayer";
import { Song } from "../model.types";

describe("SongPlayer Component", () => {
  const mockSongWithYoutube: Song = {
    id: 101,
    artist: "Daft Punk",
    title: "One More Time",
    albumid: 1,
    albumpartid: null,
    bpm: 123,
    bpmlock: false,
    comments: null,
    curator: null,
    dateadded: "2023-01-01",
    dupeid: null,
    durationinms: 320000,
    energy: 7,
    featuring: null,
    filepath: "/music/one_more_time.mp3",
    googlesongid: null,
    lowquality: false,
    musicvideoid: null,
    rating: 5,
    remixer: null,
    resongid: null,
    search_text: null,
    spotifyid: null,
    tonickey: "11B",
    tonickeylock: false,
    track: "1",
    trashed: false,
    youtubeid: "FGBhQbmPwH8",
    youtubemusicid: null,
  };

  const mockSongWithBothIds: Song = {
    ...mockSongWithYoutube,
    youtubeid: "FGBhQbmPwH8",
    youtubemusicid: "ytMusicId123",
  };

  const mockSongWithoutYoutube: Song = {
    ...mockSongWithYoutube,
    youtubeid: null,
    youtubemusicid: null,
  };

  let mockPlayerInstance: any;
  let playerEvents: Record<string, Function> = {};

  beforeEach(() => {
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
      loadVideoById: vi.fn((_id: string) => {
        if (playerEvents.onStateChange) {
          playerEvents.onStateChange({ data: 1 }); // PLAYING
        }
      }),
      cueVideoById: vi.fn(),
      destroy: vi.fn(),
      getCurrentTime: vi.fn().mockReturnValue(45),
      getDuration: vi.fn().mockReturnValue(320),
    };

    // Mock window.YT
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

  it("renders fallback message and search link when song has no youtubeid", () => {
    render(() => <SongPlayer song={mockSongWithoutYoutube} />);

    expect(screen.getByText(/no youtube id linked/i)).toBeInTheDocument();
    expect(screen.getByText(/search yt music/i)).toBeInTheDocument();
  });

  it("renders play button, position slider, and timestamp when youtubeid is present", async () => {
    render(() => <SongPlayer song={mockSongWithYoutube} />);

    const playBtn = await screen.findByRole("button", { name: /play/i });
    expect(playBtn).toBeInTheDocument();

    const slider = screen.getByLabelText(/song position/i);
    expect(slider).toBeInTheDocument();

    // Duration 320s is 5:20
    expect(screen.getByText("5:20")).toBeInTheDocument();
  });

  it("toggles play and pause when the play button is clicked", async () => {
    render(() => <SongPlayer song={mockSongWithYoutube} />);

    const playBtn = await screen.findByRole("button", { name: /play/i });
    await fireEvent.click(playBtn);

    expect(mockPlayerInstance.playVideo).toHaveBeenCalled();

    // State changes to playing -> button becomes Pause
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    });

    // Click pause
    const pauseBtn = screen.getByRole("button", { name: /pause/i });
    await fireEvent.click(pauseBtn);
    expect(mockPlayerInstance.pauseVideo).toHaveBeenCalled();
  });

  it("seeks video when slider is changed", async () => {
    render(() => <SongPlayer song={mockSongWithYoutube} />);

    const slider = await screen.findByLabelText(/song position/i);
    fireEvent.change(slider, { target: { value: "120" } });

    expect(mockPlayerInstance.seekTo).toHaveBeenCalledWith(120, true);
  });

  it("prioritizes youtubemusicid over youtubeid when initializing player", async () => {
    render(() => <SongPlayer song={mockSongWithBothIds} />);

    await screen.findByRole("button", { name: /play/i });
    expect(window.YT.Player).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        videoId: "ytMusicId123",
      })
    );
  });

  it("does not reinitialize or stop playback when song rating or metadata is updated", async () => {
    const [songSignal, setSongSignal] = createSignal<Song>(mockSongWithYoutube);
    render(() => <SongPlayer song={songSignal()} />);

    await screen.findByRole("button", { name: /play/i });
    expect(window.YT.Player).toHaveBeenCalledTimes(1);

    // Simulate rating update (new object reference with same ID and YouTube ID)
    setSongSignal({
      ...mockSongWithYoutube,
      rating: 4,
    });

    // Player constructor should NOT be called again, and destroy should not be called
    expect(window.YT.Player).toHaveBeenCalledTimes(1);
    expect(mockPlayerInstance.destroy).not.toHaveBeenCalled();
  });

  it("reuses existing player instance with cueVideoById when switching songs", async () => {
    const [songSignal, setSongSignal] = createSignal<Song>(mockSongWithYoutube);
    render(() => <SongPlayer song={songSignal()} />);

    await screen.findByRole("button", { name: /play/i });
    expect(window.YT.Player).toHaveBeenCalledTimes(1);

    // Switch to different song
    setSongSignal({
      ...mockSongWithYoutube,
      id: 102,
      youtubeid: "nextVideoId123",
    });

    // Should call cueVideoById without creating a new YT.Player or destroying old one
    await waitFor(() => {
      expect(mockPlayerInstance.cueVideoById).toHaveBeenCalledWith("nextVideoId123");
    });
    expect(window.YT.Player).toHaveBeenCalledTimes(1);
  });

  it("displays error message when video playback errors occur", async () => {
    render(() => <SongPlayer song={mockSongWithYoutube} />);

    await waitFor(() => {
      expect(playerEvents.onError).toBeDefined();
    });

    // Trigger restricted embed error (150)
    playerEvents.onError({ data: 150 });

    expect(await screen.findByText(/embed playback restricted/i)).toBeInTheDocument();
  });
});
