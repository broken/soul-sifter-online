import { IoChevronBack } from 'solid-icons/io'
import { Show, type Component } from "solid-js";

import { genreToEdit, setGenreToEdit } from "./GenreListItem";


const GenreInfo: Component = () => {
  return (
    <Show when={!!genreToEdit()}>
      <div class="card w-96 bg-base-200 shadow-xl m-auto absolute left-0 right-0 top-1/4">
        <div class="card-body">
          <h2 class="card-title">Track</h2>
          <span>{genreToEdit()?.name}</span>
          <span>{genreToEdit()?.description}</span>
          <IoChevronBack onclick={() => setGenreToEdit(undefined)}/>
        </div>
      </div>
    </Show>
  );
};

export default GenreInfo;
