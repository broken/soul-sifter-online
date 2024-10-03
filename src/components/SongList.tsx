import { type Component, createEffect, Index, DEV, Show } from 'solid-js'

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
  createEffect(async () => {
    console.log("is dev: ", DEV)
    const playlist = activePlaylist()
    let playlists: number[] = []
    if (playlist && playlist.id) {
      playlists = [playlist.id]
    }
    let songResults = await searchSongs(
      searchQuery(),
      !DEV ? 20 : 3 /* limit */,
      0 /* bpm */,
      '' /* key */,
      activeGenres().map(g => g.id),
      [] /* songs to omit */,
      playlists /* playlists */,
      0 /* energy */,
      OrderBy.DATE_ADDED,
      undefined /* callback */
    )
    setSongs(songResults)
  })

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
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
    </div>
  )
}

export default SongList
