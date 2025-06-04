import { type Component, createEffect, Index, DEV, Show, createResource } from 'solid-js'

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

  const sourceAccessor = () => ({
    query: searchQuery(),
    genreIds: activeGenres().map(g => g.id),
    playlist: activePlaylist()
  })

  const fetchSongs = async (source: ReturnType<typeof sourceAccessor>) => {
    console.log("is dev: ", DEV)
    let playlists: number[] = []
    if (source.playlist && source.playlist.id) {
      playlists = [source.playlist.id]
    }
    return await searchSongs(
      source.query,
      !DEV ? 20 : 3 /* limit */,
      0 /* bpm */,
      '' /* key */,
      source.genreIds,
      [] /* songs to omit */,
      playlists /* playlists */,
      0 /* energy */,
      OrderBy.DATE_ADDED,
      undefined /* callback */
    )
  }

  const [songData] = createResource(sourceAccessor, fetchSongs)

  createEffect(() => {
    const data = songData()
    if (data && !songData.loading) {
      setSongs(data)
    }
  })

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      {songData.loading && <div>Loading songs...</div>}
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
