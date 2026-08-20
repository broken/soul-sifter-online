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
      if (window.YT && window.YT.Player) {
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

  const youtubeId = () => props.song?.youtubemusicid?.trim() || props.song?.youtubeid?.trim() || "";

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
  };

  const initPlayer = async (ytId: string) => {
    destroyPlayer();

    if (!ytId) {
      shouldAutoPlayNext = false;
      // Set estimated duration from song metadata if available
      if (props.song?.durationinms) {
        setDuration(Math.round(props.song.durationinms / 1000));
      }
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

    const autoplayFlag = shouldAutoPlayNext ? 1 : 0;

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
            if (shouldAutoPlayNext) {
              shouldAutoPlayNext = false;
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
            } else if (state === 2) {
              // PAUSED
              setIsPlaying(false);
              setIsBuffering(false);
              stopTimer();
            } else if (state === 3) {
              // BUFFERING
              setIsBuffering(true);
            } else if (state === 0) {
              // ENDED
              setIsPlaying(false);
              setIsBuffering(false);
              stopTimer();
              setCurrentTime(duration());

              if (autoPlayNext()) {
                const songList = songs();
                if (songList && songList.length > 0 && props.song) {
                  const currentIndex = songList.findIndex((s) => s.id === props.song?.id);
                  if (currentIndex !== -1 && currentIndex + 1 < songList.length) {
                    const nextSong = songList[currentIndex + 1];
                    shouldAutoPlayNext = true;
                    if (props.onAutoPlayNext) {
                      props.onAutoPlayNext();
                    } else if (setSong) {
                      setSong(nextSong);
                    }
                  }
                }
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

    initPlayer(currentYtId);
  });

  onCleanup(() => {
    shouldAutoPlayNext = false;
    destroyPlayer();
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
    <div class="w-full bg-base-300/60 rounded-xl p-3 my-3 border border-base-content/10 flex flex-col gap-2">
      {/* Hidden container for YouTube Iframe - off-screen so audio plays cleanly */}
      <div
        ref={playerContainerRef}
        class="absolute -left-[9999px] -top-[9999px] w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden"
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
