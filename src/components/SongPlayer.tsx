import { Component, createSignal, createEffect, onMount, onCleanup, Show } from "solid-js";
import { Song } from "../model.types";
import { useAutoPlay } from "./AutoPlayContext";
import { SongConsumer } from "./SongContext";
import { useSongs } from "./SongsContext";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Global promise to load the YouTube IFrame API script once
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise<void>((resolve) => {
    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve();
    };

    // Fallback polling in case callback was missed
    const checkInterval = window.setInterval(() => {
      if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });

  return ytApiPromise;
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export interface SongPlayerProps {
  song?: Song | null;
  onAutoPlayNext?: () => void;
}

const SongPlayer: Component<SongPlayerProps> = (props) => {
  let playerContainerRef: HTMLDivElement | undefined;
  let playerInstance: any = null;
  let timeInterval: number | undefined;
  let shouldAutoPlayNext = false;

  const autoPlayContext = useAutoPlay?.();
  const songConsumer = SongConsumer?.();
  const songsContext = useSongs?.();

  const autoPlayNext = () => autoPlayContext?.autoPlayNext?.() ?? false;
  const autoPlayOnOpen = () => autoPlayContext?.autoPlayOnOpen?.() ?? false;
  const songs = () => songsContext?.songs ?? [];
  const setSong = (s: Song | undefined) => songConsumer?.setSong?.(s);

  const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
  const [isBuffering, setIsBuffering] = createSignal<boolean>(false);
  const [currentTime, setCurrentTime] = createSignal<number>(0);
  const [duration, setDuration] = createSignal<number>(0);
  const [isSeeking, setIsSeeking] = createSignal<boolean>(false);
  const [seekValue, setSeekValue] = createSignal<number>(0);
  const [playerReady, setPlayerReady] = createSignal<boolean>(false);
  const [hasError, setHasError] = createSignal<boolean>(false);
  const [errorMessage, setErrorMessage] = createSignal<string>("");

  let currentlyPlayingYtId: string | undefined = undefined;

  const youtubeId = () => props.song?.youtubemusicid?.trim() || props.song?.youtubeid?.trim() || "";

  const updateMediaSession = (targetSong = props.song) => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    if (targetSong) {
      const ytId = targetSong.youtubemusicid?.trim() || targetSong.youtubeid?.trim() || "";
      const artworkList: Array<{ src: string; sizes: string; type: string }> = [];

      if (ytId) {
        artworkList.push({
          src: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          sizes: "480x360",
          type: "image/jpeg",
        });
      }
      artworkList.push(
        { src: "/assets/icon_192.png", sizes: "192x192", type: "image/png" },
        { src: "/assets/icon_512.png", sizes: "512x512", type: "image/png" }
      );

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: targetSong.title || "Unknown Title",
          artist: targetSong.artist || "Unknown Artist",
          artwork: artworkList,
        });
      } catch (err) {
        console.warn("MediaMetadata construction error:", err);
      }
    } else {
      try {
        navigator.mediaSession.metadata = null;
      } catch {
        // Ignore
      }
    }
  };

  const updateMediaSessionPlaybackState = (state: "playing" | "paused" | "none") => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {
      // Ignore
    }
  };

  const updatePositionState = (pos: number, dur: number) => {
    if (
      typeof navigator !== "undefined" &&
      "mediaSession" in navigator &&
      typeof navigator.mediaSession.setPositionState === "function"
    ) {
      try {
        if (dur > 0 && pos >= 0 && pos <= dur) {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: 1,
            position: Math.min(pos, dur),
          });
        }
      } catch {
        // Ignore position state errors
      }
    }
  };

  const playNextSong = (_isAutoPlay = false): boolean => {
    const songList = songs();
    if (!songList || songList.length === 0 || !props.song) return false;

    const currentIndex = songList.findIndex((s) => s.id === props.song?.id);
    if (currentIndex === -1 || currentIndex + 1 >= songList.length) return false;

    const nextSong = songList[currentIndex + 1];
    const nextYtId = nextSong.youtubemusicid?.trim() || nextSong.youtubeid?.trim() || "";

    // 1. Immediately update MediaSession with next song metadata & playing state
    updateMediaSession(nextSong);
    updateMediaSessionPlaybackState("playing");

    // 2. Seamlessly trigger loadVideoById on the player instance synchronously
    if (nextYtId && playerInstance && typeof playerInstance.loadVideoById === "function") {
      currentlyPlayingYtId = nextYtId;
      try {
        playerInstance.loadVideoById(nextYtId);
      } catch (err) {
        console.warn("Direct loadVideoById error:", err);
      }
    }

    shouldAutoPlayNext = true;
    if (props.onAutoPlayNext) {
      props.onAutoPlayNext();
    } else if (setSong) {
      setSong(nextSong);
    }

    return true;
  };

  const playPreviousSong = () => {
    if (currentTime() > 3 && playerInstance && typeof playerInstance.seekTo === "function") {
      playerInstance.seekTo(0, true);
      setCurrentTime(0);
      if (playerInstance.playVideo) {
        playerInstance.playVideo();
      }
      return;
    }
    const songList = songs();
    if (songList && songList.length > 0 && props.song) {
      const currentIndex = songList.findIndex((s) => s.id === props.song?.id);
      if (currentIndex > 0) {
        const prevSong = songList[currentIndex - 1];
        const prevYtId = prevSong.youtubemusicid?.trim() || prevSong.youtubeid?.trim() || "";

        updateMediaSession(prevSong);
        updateMediaSessionPlaybackState("playing");

        if (prevYtId && playerInstance && typeof playerInstance.loadVideoById === "function") {
          currentlyPlayingYtId = prevYtId;
          try {
            playerInstance.loadVideoById(prevYtId);
          } catch (err) {
            console.warn("Direct loadVideoById error:", err);
          }
        }

        shouldAutoPlayNext = true;
        if (setSong) {
          setSong(prevSong);
        }
      }
    }
  };

  const startTimer = () => {
    stopTimer();
    timeInterval = window.setInterval(() => {
      if (playerInstance && typeof playerInstance.getCurrentTime === "function" && !isSeeking()) {
        try {
          const cur = playerInstance.getCurrentTime() || 0;
          setCurrentTime(cur);
          const dur = playerInstance.getDuration() || 0;
          if (dur > 0 && dur !== duration()) {
            setDuration(dur);
          }
          updatePositionState(cur, dur > 0 ? dur : duration());
        } catch {
          // Ignore polling errors during player transitions
        }
      }
    }, 250);
  };

  const stopTimer = () => {
    if (timeInterval !== undefined) {
      clearInterval(timeInterval);
      timeInterval = undefined;
    }
  };

  const destroyPlayer = () => {
    stopTimer();
    currentlyPlayingYtId = undefined;
    if (playerInstance) {
      try {
        if (typeof playerInstance.stopVideo === "function") {
          playerInstance.stopVideo();
        }
        if (typeof playerInstance.destroy === "function") {
          playerInstance.destroy();
        }
      } catch (err) {
        console.warn("Error destroying YT player:", err);
      }
      playerInstance = null;
    }
    setPlayerReady(false);
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    setErrorMessage("");
    updateMediaSessionPlaybackState("none");
  };

  const loadOrCueSong = (ytId: string) => {
    if (!playerInstance || !playerReady()) {
      initPlayer(ytId);
      return;
    }

    if (!ytId) {
      currentlyPlayingYtId = undefined;
      shouldAutoPlayNext = false;
      try {
        if (typeof playerInstance.stopVideo === "function") {
          playerInstance.stopVideo();
        }
      } catch (err) {
        console.warn("Error stopping video:", err);
      }
      setIsPlaying(false);
      setIsBuffering(false);
      stopTimer();
      setCurrentTime(0);
      setDuration(props.song?.durationinms ? Math.round(props.song.durationinms / 1000) : 0);
      setHasError(false);
      setErrorMessage("");
      updateMediaSession();
      updateMediaSessionPlaybackState("none");
      return;
    }

    setHasError(false);
    setErrorMessage("");
    setCurrentTime(0);
    if (props.song?.durationinms) {
      setDuration(Math.round(props.song.durationinms / 1000));
    }

    // If this video ID is already actively loading from playNextSong / playPreviousSong
    if (currentlyPlayingYtId === ytId) {
      updateMediaSession();
      return;
    }

    const willAutoPlay = shouldAutoPlayNext || autoPlayOnOpen();
    shouldAutoPlayNext = false;

    try {
      if (willAutoPlay) {
        currentlyPlayingYtId = ytId;
        if (typeof playerInstance.loadVideoById === "function") {
          playerInstance.loadVideoById(ytId);
        } else if (typeof playerInstance.cueVideoById === "function") {
          playerInstance.cueVideoById(ytId);
          playerInstance.playVideo?.();
        }
      } else {
        currentlyPlayingYtId = undefined;
        if (typeof playerInstance.cueVideoById === "function") {
          playerInstance.cueVideoById(ytId);
        }
      }
    } catch (err) {
      console.warn("Error loading/cueing video on existing player:", err);
      initPlayer(ytId);
    }
    updateMediaSession();
  };

  const initPlayer = async (ytId: string) => {
    destroyPlayer();

    if (!ytId) {
      shouldAutoPlayNext = false;
      // Set estimated duration from song metadata if available
      if (props.song?.durationinms) {
        setDuration(Math.round(props.song.durationinms / 1000));
      }
      updateMediaSession();
      return;
    }

    if (props.song?.durationinms) {
      setDuration(Math.round(props.song.durationinms / 1000));
    }

    await loadYouTubeIframeApi();

    if (!playerContainerRef) return;

    // Create a fresh child element for YT.Player replacement
    playerContainerRef.innerHTML = '<div class="yt-embed-target"></div>';
    const targetElement = playerContainerRef.querySelector(".yt-embed-target");
    if (!targetElement) return;

    const willAutoPlay = shouldAutoPlayNext || autoPlayOnOpen();
    const autoplayFlag = willAutoPlay ? 1 : 0;
    if (willAutoPlay) {
      currentlyPlayingYtId = ytId;
    }

    try {
      playerInstance = new window.YT.Player(targetElement, {
        height: "100%",
        width: "100%",
        videoId: ytId,
        playerVars: {
          autoplay: autoplayFlag,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            const dur = event.target?.getDuration?.() || 0;
            if (dur > 0) {
              setDuration(dur);
            }
            updateMediaSession();
            if (shouldAutoPlayNext || autoPlayOnOpen()) {
              shouldAutoPlayNext = false;
              currentlyPlayingYtId = ytId;
              try {
                event.target?.playVideo?.();
              } catch (err) {
                console.warn("Auto-play playVideo error:", err);
              }
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
            const state = event.data;
            if (state === 1) {
              // PLAYING
              setIsPlaying(true);
              setIsBuffering(false);
              startTimer();
              updateMediaSession();
              updateMediaSessionPlaybackState("playing");
              try {
                const cur = playerInstance?.getCurrentTime?.() || 0;
                const dur = playerInstance?.getDuration?.() || duration() || 0;
                updatePositionState(cur, dur);
              } catch {
                // Ignore
              }
            } else if (state === 2) {
              // PAUSED
              setIsPlaying(false);
              setIsBuffering(false);
              stopTimer();
              updateMediaSessionPlaybackState("paused");
              try {
                const cur = playerInstance?.getCurrentTime?.() || 0;
                const dur = playerInstance?.getDuration?.() || duration() || 0;
                updatePositionState(cur, dur);
              } catch {
                // Ignore
              }
            } else if (state === 3) {
              // BUFFERING
              setIsBuffering(true);
            } else if (state === 0) {
              // ENDED
              setIsPlaying(false);
              setIsBuffering(false);
              stopTimer();
              setCurrentTime(duration());

              const handled = autoPlayNext() && playNextSong(true);
              if (!handled) {
                updateMediaSessionPlaybackState("none");
              }
            } else if (state === 5 || state === -1) {
              // CUED or UNSTARTED
              setIsPlaying(false);
              setIsBuffering(false);
            }
          },
          onError: (event: any) => {
            setHasError(true);
            setIsPlaying(false);
            setIsBuffering(false);
            stopTimer();
            updateMediaSessionPlaybackState("none");
            const code = event.data;
            if (code === 101 || code === 150) {
              setErrorMessage("Embed playback restricted by copyright owner.");
            } else if (code === 100 || code === 2) {
              setErrorMessage("Video not found or invalid ID.");
            } else {
              setErrorMessage("Unable to play audio from YouTube.");
            }
          },
        },
      });
    } catch (err) {
      console.error("Failed to instantiate YT.Player", err);
      setHasError(true);
      setErrorMessage("Failed to load YouTube player.");
    }
  };

  let lastSongId: number | undefined = undefined;
  let lastLoadedYtId: string | undefined = undefined;

  createEffect(() => {
    const currentSong = props.song;
    const currentSongId = currentSong?.id;
    const currentYtId = youtubeId();

    if (currentSongId === lastSongId && currentYtId === lastLoadedYtId) {
      return;
    }
    lastSongId = currentSongId;
    lastLoadedYtId = currentYtId;

    if (playerInstance && playerReady()) {
      loadOrCueSong(currentYtId);
    } else {
      initPlayer(currentYtId);
    }
  });

  onMount(() => {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => {
          if (playerInstance && typeof playerInstance.playVideo === "function") {
            playerInstance.playVideo();
          }
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          if (playerInstance && typeof playerInstance.pauseVideo === "function") {
            playerInstance.pauseVideo();
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          playNextSong(false);
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          playPreviousSong();
        });
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && playerInstance && typeof playerInstance.seekTo === "function") {
            playerInstance.seekTo(details.seekTime, true);
            setCurrentTime(details.seekTime);
          }
        });
      } catch (err) {
        console.warn("MediaSession action handler error:", err);
      }
    }
  });

  onCleanup(() => {
    shouldAutoPlayNext = false;
    destroyPlayer();
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
        navigator.mediaSession.playbackState = "none";
      } catch {
        // Ignore
      }
    }
  });

  const togglePlayPause = () => {
    if (!playerInstance || !playerReady()) {
      // If we have an ID but player isn't initialized yet, try initializing
      if (youtubeId()) {
        initPlayer(youtubeId()).then(() => {
          if (playerInstance && typeof playerInstance.playVideo === "function") {
            playerInstance.playVideo();
          }
        });
      }
      return;
    }

    try {
      if (isPlaying()) {
        playerInstance.pauseVideo();
      } else {
        playerInstance.playVideo();
      }
    } catch (err) {
      console.error("Error toggling playback:", err);
    }
  };

  const handleSliderInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const val = parseFloat(e.currentTarget.value);
    setIsSeeking(true);
    setSeekValue(val);
  };

  const handleSliderChange = (e: Event & { currentTarget: HTMLInputElement }) => {
    const val = parseFloat(e.currentTarget.value);
    setIsSeeking(false);
    setCurrentTime(val);

    if (playerInstance && typeof playerInstance.seekTo === "function") {
      try {
        playerInstance.seekTo(val, true);
        if (!isPlaying()) {
          playerInstance.playVideo();
        }
      } catch (err) {
        console.error("Error seeking:", err);
      }
    }
  };

  const currentSliderTime = () => (isSeeking() ? seekValue() : currentTime());
  const maxDuration = () => (duration() > 0 ? duration() : 100);

  const getYouTubeMusicUrl = () => {
    const id = youtubeId();
    if (id) {
      return `https://music.youtube.com/watch?v=${id}`;
    }
    const artist = encodeURIComponent(props.song?.artist || "");
    const title = encodeURIComponent(props.song?.title || "");
    return `https://music.youtube.com/search?q=${artist}+${title}`;
  };

  return (
    <div class="relative w-full bg-base-300/60 rounded-xl p-3 my-3 border border-base-content/10 flex flex-col gap-2 overflow-hidden">
      {/* Container for YouTube Iframe - rendered with real layout box so mobile OS background power management does not suspend audio */}
      <div
        ref={playerContainerRef}
        class="absolute top-0 left-0 w-[200px] h-[200px] -z-10 opacity-[0.001] pointer-events-none overflow-hidden"
        aria-hidden="true"
      />

      <Show
        when={youtubeId()}
        fallback={
          <div class="flex items-center justify-between text-xs py-1 px-2 text-base-content/60 bg-base-200/50 rounded-lg">
            <span>No YouTube ID linked for playback</span>
            <a
              href={getYouTubeMusicUrl()}
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-ghost btn-xs text-primary underline"
            >
              Search YT Music ↗
            </a>
          </div>
        }
      >
        <Show when={hasError()}>
          <div class="alert alert-warning py-1.5 px-3 text-xs flex flex-row items-center justify-between shadow-sm">
            <span class="truncate">{errorMessage()}</span>
            <a
              href={getYouTubeMusicUrl()}
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-xs btn-outline btn-neutral shrink-0 ml-2"
            >
              Open YT Music ↗
            </a>
          </div>
        </Show>

        {/* Main Controls Row */}
        <div class="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            type="button"
            class="btn btn-circle btn-primary btn-sm shrink-0 shadow-md transition-transform active:scale-95 flex items-center justify-center"
            onClick={togglePlayPause}
            disabled={!playerReady() && isBuffering()}
            aria-label={isPlaying() ? "Pause" : "Play"}
            title={isPlaying() ? "Pause" : "Play"}
          >
            <Show
              when={!isBuffering()}
              fallback={<span class="loading loading-spinner loading-xs text-primary-content" />}
            >
              <Show
                when={isPlaying()}
                fallback={
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                }
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </Show>
            </Show>
          </button>

          {/* Slider & Time Indicator */}
          <div class="flex-1 flex flex-col justify-center gap-1 min-w-0">
            <input
              type="range"
              min="0"
              max={maxDuration()}
              step="0.5"
              value={currentSliderTime()}
              onInput={handleSliderInput}
              onChange={handleSliderChange}
              class="range range-primary range-xs w-full cursor-pointer accent-primary"
              aria-label="Song position"
            />
            <div class="flex justify-between text-[11px] font-mono text-base-content/70 px-0.5">
              <span>{formatTime(currentSliderTime())}</span>
              <span>{formatTime(duration())}</span>
            </div>
          </div>

          {/* Direct link to YouTube Music */}
          <a
            href={getYouTubeMusicUrl()}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost btn-circle btn-xs text-base-content/70 hover:text-primary shrink-0"
            title="Open in YouTube Music"
            aria-label="Open in YouTube Music"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </a>
        </div>
      </Show>
    </div>
  );
};

export default SongPlayer;
