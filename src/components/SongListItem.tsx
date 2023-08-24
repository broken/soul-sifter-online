import type { Component } from 'solid-js';
import { Song } from './SongList';

const SongListItem: Component<{song: Song}> = (props) => {
  return (
    <div>
      <b>{props.song.artist}</b> - {props.song.title}
    </div>
  );
};

export default SongListItem;
