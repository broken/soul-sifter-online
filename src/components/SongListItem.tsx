import { type Component, Show } from 'solid-js'

import { Song } from '../model.types'
import Rating from './Rating'
import { SongConsumer } from './SongContext'
import styles from './SongListItem.module.css'


const SongListItem: Component<{song: Song}> = (props) => {
  const {setSong} = SongConsumer()

  const openVideo = (youtubeId: string | undefined) =>  {
    if (!youtubeId) {
      console.log('Youtube ID is undefined.')
      return
    }
    const appLink = `youtube://video?id=${youtubeId}`
    window.open(appLink)
  }

  const handleSwipe = (youtubeId: string | undefined, event: TouchEvent) => {
    // define the minimum distance to trigger the action
    const minDistance = 80
    const target = event.target as Element
    const container = target.parentElement
    if (container == null) return
    // get the distance the user swiped
    const swipeDistance = container.scrollLeft
    console.log(`swiped distance of ${swipeDistance} = ${container.scrollLeft} - ${target.clientWidth}`)
    if (swipeDistance > minDistance) {
      openVideo(youtubeId)
    } else {
      console.log(`did not swipe ${minDistance}px`)
    }
  }

  return (
    <tr onclick={() => setSong?.(props.song)}>
      <td class="px-0 py-0" classList={{ [styles.swipe_container]: !!props.song.youtubeid }} ontouchend={[handleSwipe, props.song.youtubeid]}>
        <div class={`flex flex-row justify-between px-6 py-3 min-w-screen max-w-screen ${styles["swipe-element"]}`}>
          <span class={styles.data}>
            <span>{props.song.artist}</span>
            <span> - </span>
            <span><b>{props.song.title}</b></span>
          </span>
          <Rating song={props.song} mutable={false} />
        </div>
        <Show when={props.song.youtubeid}>
          <div class={`px-1 py-4 ${styles.action} ${styles.right}`}>
            <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M21.7 8c0-.7-.4-1.3-.8-2-.5-.5-1.2-.8-2-.8C16.2 5 12 5 12 5s-4.2 0-7 .2c-.7 0-1.4.3-2 .9-.3.6-.6 1.2-.7 2l-.2 3.1v1.5c0 1.1 0 2.2.2 3.3 0 .7.4 1.3.8 2 .6.5 1.4.8 2.2.8l6.7.2s4.2 0 7-.2c.7 0 1.4-.3 2-.9.3-.5.6-1.2.7-2l.2-3.1v-1.6c0-1 0-2.1-.2-3.2ZM10 14.6V9l5.4 2.8-5.4 2.8Z" clip-rule="evenodd"/>
            </svg>
          </div>
        </Show>
      </td>
    </tr>
  )
}

export default SongListItem
