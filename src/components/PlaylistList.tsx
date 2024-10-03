import { type Component, createEffect, createResource, Index, createSignal, DEV, Show, createMemo } from 'solid-js'
import { supabase } from '../App'
import { Tables } from '../database.types'
import PlaylistListItem from './PlaylistListItem'


const PlaylistList: Component = () => {
  const [playlists] = createResource<Tables<'playlists'>[]>(async () => {
    let playlistsList: Tables<'playlists'>[] = []
    const { data, error } = await supabase.from('playlists').select()
    if (error) {
      console.error(error)
    }
    if (data) {
      if (DEV) console.log(data)
      data.forEach((x) => {
        playlistsList.push(x)
      })
    }
    playlistsList.sort((a, b) => a.name!.localeCompare(b.name!))
    return playlistsList
  })

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={playlists()}>
            {playlist => <PlaylistListItem playlist={playlist()} />}
          </Index>
        </tbody>
      </table>
    </div>
  )
}

export default PlaylistList
