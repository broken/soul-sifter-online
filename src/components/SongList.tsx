import { type Component, createEffect, Index, DEV, Show, createSignal, onMount, onCleanup, on, createRoot, createResource } from 'solid-js'

import { useGenres } from './GenresContext'
import { useActivePlaylist } from './PlaylistContext'
import { searchQuery } from './SearchToolbar'
import { searchSongs, OrderBy } from '../SearchUtil'
import SongListItem from './SongListItem'
import { useSongs } from './SongsContext'


const SongList: Component = () => {
  const {activeGenres, setActiveGenres} = useGenres()
  const {activePlaylist, setActivePlaylist} = useActivePlaylist()
  const {songs, setSongs} = useSongs()
  const [currentPage, setCurrentPage] = createSignal(0) // Page to fetch
  // const [loading, setLoading] = createSignal(false) // Will be replaced by resource's loading state
  const [hasMoreSongs, setHasMoreSongs] = createSignal(true)

  let disposeHasMoreSongsEffect: (() => void) | null = null;
  let sentinel: HTMLDivElement | undefined;
  let scrollContainerRef: HTMLDivElement | undefined; // Ref for the scrollable container
  let observer: IntersectionObserver | undefined;

  const fetcher = async (
    params: { page: number; query: string; genres: any[]; playlist?: any }
  ): Promise<{ songs: any[], hasMore: boolean, page: number }> => {
    const { page, query, genres, playlist } = params;
    console.log("[ResourceFetcher] Entered. Page:", page, "Query:", query, "Genres:", genres.map(g=>g.id), "Playlist:", playlist?.id);

    if (page < 0) { // Do not fetch if page is negative. hasMoreSongs is handled by resource source
      console.log("[ResourceFetcher] Page < 0, returning empty results.");
      return { songs: [], hasMore: false, page };
    }

    const limit = !DEV ? 20 : 3;
    const offset = page * limit;
    let playlistIds: number[] = [];
    if (playlist && playlist.id) {
      playlistIds = [playlist.id];
    }

    try {
      console.log("[ResourceFetcher] Calling searchSongs with offset:", offset, "limit:", limit);
      const songResults = await searchSongs(
        query,
        limit,
        0, // bpm
        '', // key
        genres.map(g => g.id), // styles
        [], // songsToOmit
        playlistIds, // playlists
        0, // energy
        offset, // offset
        OrderBy.DATE_ADDED, // orderBy
        undefined // errorCallback
      );
      console.log("[ResourceFetcher] searchSongs returned. songResults.length:", songResults.length);
      const hasMore = songResults.length === limit;
      console.log("[ResourceFetcher] Calculated hasMore:", hasMore);
      return { songs: songResults, hasMore, page };
    } catch (error) {
      console.error("[ResourceFetcher] Failed to fetch songs:", error);
      return { songs: [], hasMore: false, page }; // Return empty on error, resource handles error state
    }
  };

  const [songData, { mutate, refetch }] = createResource(
    () => ({ page: currentPage(), query: searchQuery(), genres: activeGenres(), playlist: activePlaylist() }),
    fetcher
  );

  // Effect to reset current page and clear songs when search/filter criteria change
  createEffect(on([searchQuery, activeGenres, activePlaylist], () => {
    console.log("[FilterResetEffect] Entered. searchQuery:", searchQuery(), "activeGenres:", activeGenres().map(g=>g.id), "activePlaylist:", activePlaylist()?.id);
    console.log("[FilterResetEffect] Clearing songs, resetting page and hasMoreSongs.");
    setSongs([])
    setCurrentPage(0) // This will trigger the resource to fetch due to source signal change
    setHasMoreSongs(true) // Reset hasMoreSongs
    if (observer && sentinel) {
      console.log("[FilterResetEffect] Calling observe(sentinel).");
      observer.observe(sentinel);
    }
  }));

  // Effect to update songs list and hasMoreSongs signal from resource data
  createEffect(() => {
    const currentResourceState = songData; // Access the resource signal

    if (currentResourceState.error) {
      console.error("[SongDataEffect] Error from resource:", currentResourceState.error);
      setHasMoreSongs(false); // Stop pagination on error
      // setSongs([]); // Optional: Clear songs on error, or display an error message
      return;
    }

    const data = currentResourceState(); // Get the actual data from the resource
    if (data) {
      console.log("[SongDataEffect] songData updated. Page:", data.page, "Songs count:", data.songs.length, "HasMore:", data.hasMore);

      if (data.page === 0) {
        console.log("[SongDataEffect] Page 0 detected, replacing songs list.");
        setSongs(data.songs);
      } else {
        // Only append if there are new songs and it's not page 0
        if (data.songs && data.songs.length > 0) {
          console.log("[SongDataEffect] Page > 0 and songs available, appending to list.");
          setSongs(prevSongs => [...prevSongs, ...data.songs]);
        } else {
          // This condition implies page > 0 but no new songs were returned.
          // The hasMore flag from the fetcher should correctly indicate this.
          console.log("[SongDataEffect] Page > 0 and no new songs returned or songs array is empty.");
        }
      }
      setHasMoreSongs(data.hasMore);
    }
  });

  onMount(() => {
    console.log("[onMount] Entered.");
    if (!sentinel || !scrollContainerRef) {
      console.warn("Sentinel or ScrollContainerRef not defined onMount, IntersectionObserver not set up.");
      return;
    }

    Promise.resolve().then(() => {
      console.log("[onMount] Deferred logic started.");
      // Ensure refs are still valid in the async callback, though they should be.
      if (!sentinel || !scrollContainerRef) {
        console.warn("Sentinel or ScrollContainerRef became undefined before deferred IntersectionObserver setup.");
        return;
      }

      console.log("Setting up IntersectionObserver. Diagnostics:");
      if (scrollContainerRef) {
        console.log("scrollContainerRef.clientHeight:", scrollContainerRef.clientHeight);
        console.log("scrollContainerRef.scrollHeight:", scrollContainerRef.scrollHeight);
        console.log("scrollContainerRef.getBoundingClientRect():", scrollContainerRef.getBoundingClientRect());
      }
      if (sentinel) {
        console.log("sentinel.offsetTop:", sentinel.offsetTop);
        console.log("sentinel.getBoundingClientRect():", sentinel.getBoundingClientRect());
      }

      const handleIntersect = (entries: IntersectionObserverEntry[]) => {
        console.log("[handleIntersect] Entered.");
        const entry = entries[0];
        if (!entry) return;

        console.log("[handleIntersect] entry[0]:", entry);
        console.log("[handleIntersect] isIntersecting:", entry.isIntersecting);
        console.log("[handleIntersect] songData.loading:", songData.loading);
        console.log("[handleIntersect] hasMoreSongs():", hasMoreSongs());

        // Main condition for action
        const conditionMet = entry.isIntersecting && !songData.loading && hasMoreSongs();
        console.log("[handleIntersect] Condition (isIntersecting && !songData.loading && hasMoreSongs):", conditionMet);

        if (conditionMet) {
          console.log("[handleIntersect] Condition MET. Calling setCurrentPage. Current page before inc:", currentPage());
          // Only increment page if hasMoreSongs is true, to prevent unnecessary fetches if resource already determined no more.
          // The resource itself will also guard against page < 0 or other invalid states.
          if (hasMoreSongs()) {
            setCurrentPage(currentPage() + 1);
          } else {
            console.log("[handleIntersect] Condition MET, but hasMoreSongs() is false. Not incrementing page.");
          }
        } else {
          console.log("[handleIntersect] Condition NOT MET or still loading/no more songs.");
        }
      };

      observer = new IntersectionObserver(handleIntersect, {
        root: scrollContainerRef, // Use the scrollable div as the root
        threshold: 0.1 // Trigger when 10% of the sentinel is visible
      });

      console.log("[onMount] Initial observe(sentinel) called.");
      observer.observe(sentinel); // Initial observation

      // Effect to manage observing/unobserving based on hasMoreSongs changes
      if (disposeHasMoreSongsEffect) {
          disposeHasMoreSongsEffect();
      }
      disposeHasMoreSongsEffect = createRoot(dispose => {
        console.log("[onMount] Creating createEffect for hasMoreSongs with createRoot.");
        createEffect(on(hasMoreSongs, (currentHasMoreSongs) => {
          if (!observer || !sentinel) return;
          console.log("[HasMoreSongsEffect] Entered. currentHasMoreSongs:", currentHasMoreSongs);
          if (!currentHasMoreSongs) {
            console.log("[HasMoreSongsEffect] Unobserving sentinel.");
            observer.unobserve(sentinel);
          } else {
            console.log("[HasMoreSongsEffect] Observing sentinel.");
            observer.observe(sentinel);
          }
        }, { defer: true }));
        return dispose;
      });
    });
  });

  onCleanup(() => {
    console.log("[onCleanup] Entered.");
    if (observer && sentinel) {
      observer.unobserve(sentinel); // Clean up specific element
      observer.disconnect(); // General cleanup
      console.log("[onCleanup] Observer disconnected.");
    }
    if (disposeHasMoreSongsEffect) {
      console.log("[onCleanup] Disposing hasMoreSongsEffect.");
      disposeHasMoreSongsEffect();
      disposeHasMoreSongsEffect = null; // Clear it
    }
  });

  return (
    <div ref={scrollContainerRef} class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      {/* ... existing Show components for activeGenres and activePlaylist ... */}
      <Show when={activeGenres().length}>
        <div role="alert" class="alert border-info">
        <div class="grid-flow-col justify-items-start text-start grid w-full content-start items-center gap-4" style="grid-template-columns: auto minmax(auto,1fr);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span style="display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {activeGenres().length === 1
                ? `Genre ${activeGenres()[0].name} (${activeGenres()[0].id}).`
                : activeGenres().map(g => g.name).join(', ') + '.'
              }
            </span>
            <button class="btn btn-sm bg-info text-info-content" onclick={() => setActiveGenres([])}>Clear</button>
          </div>
        </div>
      </Show>
      <Show when={activePlaylist()}>
        <div role="alert" class="alert border-info">
          <div class="grid-flow-col justify-items-start text-start grid w-full content-start items-center gap-4" style="grid-template-columns: auto minmax(auto,1fr);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Playlist {activePlaylist()?.name}.</span>
            <button class="btn btn-sm bg-info text-info-content" onclick={() => setActivePlaylist(undefined)}>Remove</button>
          </div>
        </div>
      </Show>
      <table class="table">
        <tbody>
          <Index each={songs}>
            {song => <SongListItem song={song()} />}
          </Index>
        </tbody>
      </table>
      <div ref={sentinel} style="height: 1px;"></div> {/* Sentinel element */}
      <Show when={songData.loading}>
        <div>Loading more songs...</div>
      </Show>
      <Show when={!hasMoreSongs() && !songData.loading && songs.length > 0}>
        <div>No more songs to load.</div>
      </Show>
    </div>
  )
}

export default SongList
