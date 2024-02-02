import { Index, type Component } from 'solid-js';
import Genre from '../dataclasses/Genre';
import { createMutable } from 'solid-js/store';


class GenreWrapper {
  genre: Genre;
  children: GenreWrapper[];

  constructor(genre: Genre, children: GenreWrapper[] = []) {
    this.genre = genre;
    this.children = children;
    return createMutable(this);
  }

  toString() {
    let s = `${this.genre} (`;
    for (let child of this.children) {
      s += child.toString() + ", "
    }
    s += ')'
    return s;
  }
}


const GenreListItem: Component<{genre: GenreWrapper}> = (props) => {
  return (
    <tr>
      <td class="flex flex-row justify-between px-6 py-3">
        {props.genre.genre.name}
        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
        </svg>
        <table class="table">
          <tbody>
            <Index each={props.genre.children}>
              {genre => <GenreListItem genre={genre()} />}
            </Index>
          </tbody>
        </table>
      </td>
    </tr>
  );
};

export default GenreListItem;
export {GenreWrapper};
