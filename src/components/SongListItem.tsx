import { type Component } from 'solid-js';
import Rating from './Rating';
import Song from '../dataclasses/Song';
import { SongConsumer } from './SongContext';

const SongListItem: Component<{song: Song}> = (props) => {
  const {setSong} = SongConsumer();
  return (
    <tr onclick={() => setSong?.(props.song)}>
      <td class="flex flex-row justify-between px-6 py-3">
        <span>
          <span>{props.song.artist}</span>
          <span> - </span>
          <span><b>{props.song.title}</b></span>
        </span>
        <Rating song={props.song} mutable={false} />
      </td>
    </tr>
  );
};

export default SongListItem;
