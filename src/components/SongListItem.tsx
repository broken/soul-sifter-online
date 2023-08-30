import { For, type Component, Show, createSignal } from 'solid-js';
import { Song } from './SongList';
import { ImStarEmpty, ImStarFull } from 'solid-icons/im';

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
        <span class="flex flex-row text-primary items-center">
          <For each={[...Array(5).keys()]}>
            {
              (i) => {
                return <Show when={i < (props.song.rating || 0)} fallback={<ImStarEmpty />}>
                        <ImStarFull class="fill-secondary"/>
                      </Show>
              }
            }
          </For>
        </span>
      </td>
    </tr>
  );
};

export default SongListItem;
export {song, setSong};
