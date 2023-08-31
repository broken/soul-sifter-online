import { Show, type Component } from "solid-js";
import { setSong, song } from "./SongListItem";
import { IoChevronBack } from 'solid-icons/io'
import Rating from "./Rating";
import { Song } from "./SongList";

const SongInfo: Component = () => {
  const emptySong = new Song(-1, '', '', '');
  return (
    <Show when={!!song()}>
      <div class="absolute h-screen w-screen bg-base-100 flex flex-col justify-center items-center">
        <span>{song()?.artist}</span>
        <span>{song()?.title}</span>
        <Rating song={song() || emptySong} mutable={true} />
        <IoChevronBack onclick={() => setSong(undefined)}/>
      </div>
    </Show>
  );
};

export default SongInfo;
