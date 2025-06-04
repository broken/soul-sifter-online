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
          {/* Removed h2 title "Song Info" */}
          {/* Display artist in bold, without a label */}
          <p style={{ "font-weight": "bold" }}>{song()?.artist}</p>
          {/* Display title directly, without a label */}
          <p>{song()?.title}</p>
          <div class="card-actions justify-end">
            <Rating song={song()} mutable={true} />
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SongInfo;
