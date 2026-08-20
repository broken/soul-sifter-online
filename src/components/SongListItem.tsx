import { type Component, onMount, onCleanup } from 'solid-js'

import { Song } from '../model.types'
import Rating from './Rating'
import { SongConsumer } from './SongContext'
import styles from './SongListItem.module.css'

// Module-level manager for single-open row coordination
let activeCloseRowFn: (() => void) | null = null;
let activeRowOwner: symbol | null = null;

const closeAnyOpenSongRow = (excludeOwner?: symbol) => {
  if (activeCloseRowFn && activeRowOwner !== excludeOwner) {
    const fnToClose = activeCloseRowFn;
    activeCloseRowFn = null;
    activeRowOwner = null;
    fnToClose();
  }
};

const registerOpenSongRow = (owner: symbol, closeFn: () => void) => {
  if (activeRowOwner !== owner) {
    closeAnyOpenSongRow(owner);
  }
  activeCloseRowFn = closeFn;
  activeRowOwner = owner;
};

const unregisterOpenSongRow = (owner: symbol) => {
  if (activeRowOwner === owner) {
    activeCloseRowFn = null;
    activeRowOwner = null;
  }
};

const SongListItem: Component<{song: Song}> = (props) => {
  const rowId = Symbol();
  const {setSong} = SongConsumer()
  let tdRef: HTMLTableCellElement | undefined;
  let centerRef: HTMLDivElement | undefined;
  let isOpen: 'left' | 'right' | null = null;
  let isClosing = false;
  let scrollTimeout: number | undefined;

  onMount(() => {
    if (tdRef && centerRef) {
      // Ensure the middle element (song content) is visible initially
      tdRef.scrollLeft = centerRef.offsetLeft;
    }
  });

  onCleanup(() => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    unregisterOpenSongRow(rowId);
  });

  const closeRow = () => {
    if (!tdRef || !centerRef) return;
    isClosing = true;
    unregisterOpenSongRow(rowId);
    const centerPos = centerRef.offsetLeft;
    isOpen = null;

    tdRef.scrollTo({ left: centerPos, behavior: 'smooth' });

    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      if (tdRef && centerRef) {
        tdRef.scrollLeft = centerRef.offsetLeft;
      }
      isClosing = false;
    }, 300);
  };

  const handleScroll = () => {
    if (isClosing) return;
    if (!tdRef || !centerRef) return;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      if (isClosing || !tdRef || !centerRef) return;
      const currentScroll = tdRef.scrollLeft;
      const cPos = centerRef.offsetLeft;
      const threshold = 20;

      if (currentScroll < cPos - threshold) {
        isOpen = 'left';
        registerOpenSongRow(rowId, closeRow);
      } else if (currentScroll > cPos + threshold) {
        isOpen = 'right';
        registerOpenSongRow(rowId, closeRow);
      } else {
        isOpen = null;
        unregisterOpenSongRow(rowId);
      }
    }, 80);
  };

  const handleRowClick = (e: MouseEvent) => {
    if (isOpen !== null) {
      e.stopPropagation();
      closeRow();
      return;
    }
    closeAnyOpenSongRow(rowId);
    setSong?.(props.song);
  };

  const getYouTubeUrl = (youtubeId: string | undefined, song: Song) => {
    if (youtubeId && youtubeId.trim() !== "") {
      return `https://www.youtube.com/watch?v=${youtubeId}`;
    }
    const artist = encodeURIComponent(song.artist);
    const title = encodeURIComponent(song.title);
    return `https://www.youtube.com/results?search_query=${artist}+${title}`;
  };

  const getYouTubeMusicUrl = (youtubeId: string | undefined, song: Song) => {
    if (youtubeId && youtubeId.trim() !== "") {
      return `https://music.youtube.com/watch?v=${youtubeId}`;
    }
    const artist = encodeURIComponent(song.artist);
    const title = encodeURIComponent(song.title);
    return `https://music.youtube.com/search?q=${artist}+${title}`;
  };

  return (
    <tr onclick={handleRowClick}>
      <td
        ref={tdRef}
        class={`px-0 py-0 ${styles.swipe_container}`}
        onscroll={handleScroll}
      >
        {/* Left Action: YouTube Music */}
        <a
          href={getYouTubeMusicUrl(props.song.youtubemusicid || props.song.youtubeid, props.song)}
          target="_blank"
          rel="noopener noreferrer"
          class={`${styles.action_container} ${styles.left}`}
          onclick={(e) => e.stopPropagation()}
          aria-label="Open in YouTube Music"
        >
          <div class={styles.overswipe_space} />
          <div class={styles.action_button}>
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
        </a>

        {/* Middle Content: Song Details */}
        <div
          ref={centerRef}
          class={`flex flex-row justify-between px-6 py-3 ${styles["swipe-element"]}`}
        >
          <span class={styles.data}>
            <span>{props.song.artist}</span>
            <span> - </span>
            <span><b>{props.song.title}</b></span>
          </span>
          <Rating song={props.song} mutable={false} />
        </div>

        {/* Right Action: YouTube */}
        <a
          href={getYouTubeUrl(props.song.youtubeid, props.song)}
          target="_blank"
          rel="noopener noreferrer"
          class={`${styles.action_container} ${styles.right}`}
          onclick={(e) => e.stopPropagation()}
          aria-label="Open in YouTube"
        >
          <div class={styles.action_button}>
            <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M21.7 8c0-.7-.4-1.3-.8-2-.5-.5-1.2-.8-2-.8C16.2 5 12 5 12 5s-4.2 0-7 .2c-.7 0-1.4.3-2 .9-.3.6-.6 1.2-.7 2l-.2 3.1v1.5c0 1.1 0 2.2.2 3.3 0 .7.4 1.3.8 2 .6.5 1.4.8 2.2.8l6.7.2s4.2 0 7-.2c.7 0 1.4-.3 2-.9.3-.5.6-1.2.7-2l.2-3.1v-1.6c0-1 0-2.1-.2-3.2ZM10 14.6V9l5.4 2.8-5.4 2.8Z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class={styles.overswipe_space} />
        </a>
      </td>
    </tr>
  )
}

export default SongListItem

