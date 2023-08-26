import type { Component } from 'solid-js';
import { Song } from './SongList';
import styles from './SongListItem.module.css';

const SongListItem: Component<{song: Song}> = (props) => {
  return (
    <div class={styles.SongListItem}>
      <span class="{styles.artist}">{props.song.artist}</span>
       - {props.song.title}
    </div>
  );
};

export default SongListItem;
