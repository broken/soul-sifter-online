import { type Component, createResource, Index, createSignal, DEV, Show, createMemo } from 'solid-js'
import Rating from './Rating'
import { Tables } from '../database.types'
import { SongConsumer } from './SongContext'
import styles from './PlaylistListItem.module.css'
import { useActivePlaylist } from './PlaylistContext'

const PlaylistListItem: Component<{playlist: Tables<'playlists'>}> = (props) => {
  const {activePlaylist, setActivePlaylist} = useActivePlaylist()
  const isActive = createMemo(() => {
    const ap = activePlaylist()
    return ap && ap['id'] === props.playlist['id']
  })

  const openPlaylist = (playlistId: string | undefined) =>  {
    if (!playlistId) {
      console.log('Playlist is undefined.')
      return
    }
    const appLink = `https://music.youtube.com/playlist?list=${playlistId}`
    window.open(appLink)
  }

  const handleSwipe = (playlistId: string | undefined, event: TouchEvent) => {
    console.log('swiped')
    console.log(event)
    // define the minimum distance to trigger the action
    const minDistance = 80
    const target = event.target as Element
    const container = target.parentElement
    if (container == null) return
    // get the distance the user swiped
    const swipeDistance = container.scrollLeft
    console.log(`swiped distance of ${swipeDistance} = ${container.scrollLeft} - ${target.clientWidth}`)
    if (swipeDistance > minDistance) {
      openPlaylist(playlistId)
    } else {
      console.log(`did not swipe ${minDistance}px`)
    }
  }

  return (
    <tr onclick={() => setActivePlaylist(props.playlist)}  classList={{ 'bg-slate-50': isActive() }}>
      <td class={`px-0 py-0 ${styles["swipe-container"]}`} ontouchend={[handleSwipe, props.playlist.youtubeid]}>
        <div class={`flex flex-row justify-between px-7 py-4 ${styles["swipe-element"]}`}>
          <span class="flex flex-row">
            <span>{props.playlist.name}</span>
            <Show when={props.playlist.query}>
              <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
              </svg>
            </Show>
          </span>
          <span class="flex flex-row">
            <Show when={props.playlist.youtubeid}>
              <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M21.7 8c0-.7-.4-1.3-.8-2-.5-.5-1.2-.8-2-.8C16.2 5 12 5 12 5s-4.2 0-7 .2c-.7 0-1.4.3-2 .9-.3.6-.6 1.2-.7 2l-.2 3.1v1.5c0 1.1 0 2.2.2 3.3 0 .7.4 1.3.8 2 .6.5 1.4.8 2.2.8l6.7.2s4.2 0 7-.2c.7 0 1.4-.3 2-.9.3-.5.6-1.2.7-2l.2-3.1v-1.6c0-1 0-2.1-.2-3.2ZM10 14.6V9l5.4 2.8-5.4 2.8Z" clip-rule="evenodd"/>
              </svg>
            </Show>
          </span>
        </div>
        <div class={`px-1 py-4 ${styles.action} ${styles.right}`}>
          <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M21.7 8c0-.7-.4-1.3-.8-2-.5-.5-1.2-.8-2-.8C16.2 5 12 5 12 5s-4.2 0-7 .2c-.7 0-1.4.3-2 .9-.3.6-.6 1.2-.7 2l-.2 3.1v1.5c0 1.1 0 2.2.2 3.3 0 .7.4 1.3.8 2 .6.5 1.4.8 2.2.8l6.7.2s4.2 0 7-.2c.7 0 1.4-.3 2-.9.3-.5.6-1.2.7-2l.2-3.1v-1.6c0-1 0-2.1-.2-3.2ZM10 14.6V9l5.4 2.8-5.4 2.8Z" clip-rule="evenodd"/>
          </svg>
        </div>
      </td>
    </tr>
  )
}

export default PlaylistListItem