import { type Component, createEffect, Index, DEV, Show, createSignal, onMount, onCleanup, on } from 'solid-js'

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
  const [loading, setLoading] = createSignal(false)
  const [hasMoreSongs, setHasMoreSongs] = createSignal(true)
  let sentinel: HTMLDivElement | undefined;
  let scrollContainerRef: HTMLDivElement | undefined; // Ref for the scrollable container
  let observer: IntersectionObserver | undefined;

  // Effect to reset current page and clear songs when search/filter criteria change
  createEffect(on([searchQuery, activeGenres, activePlaylist], () => {
    setSongs([])
    setCurrentPage(0)
    setHasMoreSongs(true) // Reset hasMoreSongs when filters change
    // We don't fetch here, the effect below will trigger due to currentPage changing to 0
    // (or the fetch effect runs due to filter changes directly if currentPage was already 0)
    if (observer && sentinel) { // Re-observe sentinel if filters change and it was previously unobserved
      observer.observe(sentinel);
    }
  }))

  // Effect to fetch songs when currentPage changes or search/filter criteria change
  createEffect(on([currentPage, searchQuery, activeGenres, activePlaylist], async ([page, query, genres, activeList]) => {
    if (page < 0 || !hasMoreSongs()) { // Do not fetch if page is negative or no more songs
      if (!hasMoreSongs() && observer && sentinel) {
        observer.unobserve(sentinel); // Stop observing if no more songs
      }
      return
    }
    setLoading(true)
    console.log(`Fetching page: ${page}, query: ${query}, genres: ${genres.map(g => g.name)}, playlist: ${activeList?.name}`)

    const limit = !DEV ? 20 : 3
    const offset = page * limit

    let playlistIds: number[] = []
    if (activeList && activeList.id) {
      playlistIds = [activeList.id]
    }

    try {
      const songResults = await searchSongs(
        query,
        limit,
        0 /* bpm */,
        '' /* key */,
        genres.map(g => g.id),            // styles
        [],                               // songsToOmit
        playlistIds,                      // playlists
        0,                                // energy (hardcoded to 0)
        offset,                           // offset (for pagination)
        OrderBy.DATE_ADDED,               // orderBy
        undefined                         // errorCallback
      )

      if (songResults.length === 0) {
        setHasMoreSongs(false);
      } else {
        // Songs were found. Assume there are more unless proven otherwise by results < limit.
        setHasMoreSongs(true);
        if (page === 0) {
          setSongs(songResults);
        } else {
          setSongs(prevSongs => [...prevSongs, ...songResults]);
        }
        // If the number of songs returned is less than the limit, it means we've reached the end.
        if (songResults.length < limit) {
          setHasMoreSongs(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch songs:", error)
      setHasMoreSongs(false) // Stop trying if there's an error
    } finally {
      setLoading(false)
    }
  }))

  onMount(() => {
    if (!sentinel || !scrollContainerRef) {
      console.warn("Sentinel or ScrollContainerRef not defined onMount, IntersectionObserver not set up.");
      return;
    }

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loading() && hasMoreSongs()) {
        console.log("Sentinel intersecting, loading more songs...");
        setCurrentPage(currentPage() + 1);
      }
    };

    observer = new IntersectionObserver(handleIntersect, {
      root: scrollContainerRef, // Use the scrollable div as the root
      threshold: 0.1 // Trigger when 10% of the sentinel is visible
    });

    observer.observe(sentinel); // Initial observation

    // Effect to manage observing/unobserving based on hasMoreSongs changes
    createEffect(on(hasMoreSongs, (currentHasMoreSongs) => {
      if (!observer || !sentinel) return; // Defensive check, should not be needed if outer check passed

      if (!currentHasMoreSongs) {
        console.log("No more songs (hasMoreSongs changed to false), unobserving sentinel.");
        observer.unobserve(sentinel);
      } else {
        // This branch will run if hasMoreSongs becomes true (e.g., after filter reset)
        console.log("hasMoreSongs is true, ensuring sentinel is observed.");
        observer.observe(sentinel);
      }
    }, { defer: true })); // defer: true ensures it runs only on changes to hasMoreSongs
  });

  onCleanup(() => {
    if (observer && sentinel) {
      observer.unobserve(sentinel); // Clean up specific element
      observer.disconnect(); // General cleanup
      console.log("Observer disconnected on component cleanup.");
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
            <span>Genre {activeGenres()[0].name} ({activeGenres()[0].id}).</span>
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
      <Show when={loading()}>
        <div>Loading more songs...</div>
      </Show>
      <Show when={!hasMoreSongs() && !loading() && songs.length > 0}>
        <div>No more songs to load.</div>
      </Show>
    </div>
  )
}

export default SongList
