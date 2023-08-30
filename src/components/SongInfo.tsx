import { Show, type Component } from "solid-js";
import { setSong, song } from "./SongListItem";
import { IoChevronBack } from 'solid-icons/io'

const SongInfo: Component = () => {
  return (
    <Show when={!!song()}>
      <div class="absolute h-screen w-screen bg-base-100">
        <span>{song()?.artist}</span>
        <IoChevronBack onclick={() => setSong(undefined)}/>
      </div>
    </Show>
  );
};

export default SongInfo;
