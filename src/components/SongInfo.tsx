import { Show, type Component } from "solid-js";
import { IoChevronBack } from 'solid-icons/io'
import Rating from "./Rating";
import { SongConsumer } from "./SongContext";

const SongInfo: Component = () => {
  const {song, setSong} = SongConsumer();
  return (
    <Show when={!!song()}>
      <div class="card w-96 bg-neutral shadow-xl m-auto">
        <div class="card-body">
          <h2 class="card-title">Track</h2>
          <span>{song()?.artist}</span>
          <span>{song()?.title}</span>
          <div class="card-actions justify-end">
            <Rating song={song()} mutable={true} />
          </div>
          <IoChevronBack onclick={() => setSong(undefined)}/>
        </div>
      </div>
    </Show>
  );
};

export default SongInfo;
