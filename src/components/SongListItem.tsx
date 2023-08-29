import { For, type Component, Index, Show } from 'solid-js';
import { Song } from './SongList';
import { ImStarEmpty, ImStarFull } from 'solid-icons/im';

const SongListItem: Component<{song: Song}> = (props) => {
  return (
    <tr>
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
                return <Show when={i < (props.song.rating || 0)} fallback={<ImStarEmpty children />}>
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
