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
      <div class="fixed inset-0 z-[100] overflow-hidden pointer-events-none flex items-start justify-center pt-16 md:pt-[25vh]">
        <div
          class="card w-96 max-w-[calc(100vw-2rem)] bg-base-200 shadow-xl pointer-events-auto"
          onClick={cardClickHandler} // Add click handler to the card
        >
          <div class="card-body">
            {/* Display genre name as the title */}
            <h2 class="card-title">{genreToEdit()?.name}</h2>
            {/* Display description directly, without a label */}
            <p>{genreToEdit()?.description}</p>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default GenreInfo;
