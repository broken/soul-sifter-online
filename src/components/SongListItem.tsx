import { For, type Component, Show, createSignal } from 'solid-js';
import { Song } from './SongList';
import Rating from './Rating';

const [song, setSong] = createSignal<Song>();

const SongListItem: Component<{song: Song}> = (props) => {
  return (
    <tr onclick={() => setSong(props.song)}>
      <td class="flex flex-row justify-between">
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
export {song, setSong};
