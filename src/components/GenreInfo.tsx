import { Show, type Component } from "solid-js";

import { genreToEdit, setGenreToEdit } from "./GenreListItem";
import Backdrop from './Backdrop'; // Import the Backdrop component

const GenreInfo: Component = () => {
  const handleClose = () => {
    setGenreToEdit(undefined);
  };

  const cardClickHandler = (event: MouseEvent) => {
    event.stopPropagation(); // Prevent clicks inside the card from closing it
  };

  return (
    <Show when={!!genreToEdit()}>
      <Backdrop show={!!genreToEdit()} onClick={handleClose} />
      <div
        class="card w-96 bg-base-200 shadow-xl m-auto absolute left-0 right-0 top-1/4"
        style={{ 'z-index': '100' }} // Ensure card is above backdrop
        onClick={cardClickHandler} // Add click handler to the card
      >
        <div class="card-body">
          {/* Display genre name as the title */}
          <h2 class="card-title">{genreToEdit()?.name}</h2>
          {/* Display description directly, without a label */}
          <p>{genreToEdit()?.description}</p>
        </div>
      </div>
    </Show>
  );
};

export default GenreInfo;
