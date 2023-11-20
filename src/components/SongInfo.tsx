import { Show, type Component } from "solid-js";
import { IoChevronBack } from 'solid-icons/io'
import Rating from "./Rating";
import { SongConsumer } from "./SongContext";

const SongInfo: Component = () => {
  const {song, setSong} = SongConsumer();
  return (
    <Show when={!!song()}>
      <div class="absolute h-screen w-screen bg-base-100 flex flex-col justify-center items-center">
        <span>{song()?.artist}</span>
        <span>{song()?.title}</span>
        <Rating song={song()} mutable={true} />
        <IoChevronBack onclick={() => setSong(undefined)}/>
      </div>
    </Show>
  );
};

export default SongInfo;
