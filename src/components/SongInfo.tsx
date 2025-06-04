import { Show, type Component } from "solid-js";

import Rating from "./Rating";
import { SongConsumer } from "./SongContext";
import Backdrop from './Backdrop'; // Import the Backdrop component

const SongInfo: Component = () => {
  const { song, setSong } = SongConsumer();

  const handleClose = () => {
    setSong(undefined);
  };

  const cardClickHandler = (event: MouseEvent) => {
    event.stopPropagation(); // Prevent clicks inside the card from closing it
  };

  return (
    <Show when={!!song()}>
      <Backdrop show={!!song()} onClick={handleClose} />
      <div
        class="card w-96 bg-base-200 shadow-xl m-auto absolute left-0 right-0 top-1/4"
        style={{ 'z-index': '100' }} // Ensure card is above backdrop
        onClick={cardClickHandler} // Add click handler to the card
      >
        <div class="card-body">
          <h2 class="card-title">Song Info</h2> {/* Changed title for clarity */}
          <span>Artist: {song()?.artist}</span>
          <span>Title: {song()?.title}</span>
          <div class="card-actions justify-end">
            <Rating song={song()} mutable={true} />
          </div>
          {/* Removed the back button as backdrop click handles closing */}
          {/* <IoChevronBack onclick={() => setSong(undefined)}/> */}
        </div>
      </div>
    </Show>
  );
};

export default SongInfo;
