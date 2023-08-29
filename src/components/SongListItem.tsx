import type { Component } from 'solid-js';
import { Song } from './SongList';
import styles from './SongListItem.module.css';

const SongListItem: Component<{song: Song}> = (props) => {
  return (
    <tr>
      <td class="flex flex-row">
        <span>
          <span>{props.song.artist}</span>
          <span> - </span>
          <span><b>{props.song.title}</b></span>
        </span>
        <span class="">{props.song.rating}</span>
      </td>
    </tr>
  );
};

export default SongListItem;
