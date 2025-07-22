import { type Component, Show, createEffect, onMount } from 'solid-js'

import { Song } from '../model.types'
import Rating from './Rating'
import { SongConsumer } from './SongContext'
import styles from './SongListItem.module.css'


const SongListItem: Component<{song: Song}> = (props) => {
  const {setSong} = SongConsumer()
  let tdRef: HTMLTableCellElement | undefined;

  onMount(() => {
    if (tdRef) {
      // Ensure the middle element (song content) is visible initially
      // This assumes each of the 3 child divs of tdRef take up 100% of tdRef's clientWidth effectively
      // Or that swipe-element itself defines its own width appropriately for this calculation
      tdRef.scrollLeft = tdRef.clientWidth;
    }
  });

  const openInNewTab = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  };

  const openVideo = (youtubeId: string | undefined, song: Song) =>  {
    let appLink: string;
    if (youtubeId && youtubeId.trim() !== "") {
      appLink = `https://www.youtube.com/watch?v=${youtubeId}`;
    } else {
      const artist = encodeURIComponent(song.artist);
      const title = encodeURIComponent(song.title);
      appLink = `https://www.youtube.com/results?search_query=${artist}+${title}`;
    }
    //window.open(appLink);
    openInNewTab(appLink);
  }

  const openYouTubeMusic = (youtubeId: string | undefined, song: Song) => {
    let appLink: string;
    if (youtubeId && youtubeId.trim() !== "") {
      appLink = `https://music.youtube.com/watch?v=${youtubeId}`;
    } else {
      const artist = encodeURIComponent(song.artist);
      const title = encodeURIComponent(song.title);
      appLink = `https://music.youtube.com/search?q=${artist}+${title}`;
    }
    //window.open(appLink);
    openInNewTab(appLink);
  }

  const handleSwipe = (song: Song, event: TouchEvent) => {
    const container = event.currentTarget as HTMLTableCellElement;
    if (!container) return;

    const minDistance = 75; // Minimum swipe distance to trigger action
    const itemWidth = container.clientWidth; // Assumes each of the 3 items effectively takes up clientWidth
    const currentScrollLeft = container.scrollLeft;

    // It's important that the scroll snap points are correctly configured in CSS
    // for itemWidth to be a reliable measure for the width of one item view.
    // Initial scroll is itemWidth (to show middle element).
    // Swipe Right (finger moves right, content moves right, reveals left item)
    if (currentScrollLeft < itemWidth - minDistance) {
      openYouTubeMusic(song.youtubeid, song);
      console.log("Swiped Right - YouTube Music");
    }
    // Swipe Left (finger moves left, content moves left, reveals right item)
    else if (currentScrollLeft > itemWidth + minDistance) {
      openVideo(song.youtubeid, song);
      console.log("Swiped Left - YouTube");
    } else {
      console.log("Swipe distance not sufficient or returned to center.");
    }

    // Scroll back to the center element smoothly after a short delay
    // to allow window.open to not be interrupted and for logs to be visible.
    setTimeout(() => {
      container.scrollTo({ left: itemWidth, behavior: 'smooth' });
    }, 100); // 100ms delay
  }

  return (
    <tr onclick={() => setSong?.(props.song)}>
      <td
        ref={tdRef}
        class={`px-0 py-0 ${styles.swipe_container}`}
        ontouchend={[handleSwipe, props.song]}
      >
        {/* Left Action: YouTube Music */}
        <div class={`${styles.action} ${styles.left} px-1 py-4`}>
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>

        {/* Middle Content: Song Details */}
        <div class={`flex flex-row justify-between px-6 py-3 min-w-screen max-w-screen ${styles["swipe-element"]}`}>
          <span class={styles.data}>
            <span>{props.song.artist}</span>
            <span> - </span>
            <span><b>{props.song.title}</b></span>
          </span>
          <Rating song={props.song} mutable={false} />
        </div>

        {/* Right Action: YouTube */}
        <div class={`px-1 py-4 ${styles.action} ${styles.right}`}>
          <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M21.7 8c0-.7-.4-1.3-.8-2-.5-.5-1.2-.8-2-.8C16.2 5 12 5 12 5s-4.2 0-7 .2c-.7 0-1.4.3-2 .9-.3.6-.6 1.2-.7 2l-.2 3.1v1.5c0 1.1 0 2.2.2 3.3 0 .7.4 1.3.8 2 .6.5 1.4.8 2.2.8l6.7.2s4.2 0 7-.2c.7 0 1.4-.3 2-.9.3-.5.6-1.2.7-2l.2-3.1v-1.6c0-1 0-2.1-.2-3.2ZM10 14.6V9l5.4 2.8-5.4 2.8Z" clip-rule="evenodd"/>
          </svg>
        </div>
      </td>
    </tr>
  )
}

export default SongListItem
