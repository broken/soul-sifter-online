import { Index, type Component, createSignal, Show, mergeProps } from 'solid-js';
import { Tables } from '../database.types';
import { createMutable } from 'solid-js/store';
import { useGenres } from './GenresContext';


class GenreWrapper {
  genre: Tables<'styles'>;
  children: GenreWrapper[];

  constructor(genre: Tables<'styles'>, children: GenreWrapper[] = []) {
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


const GenreListItem: Component<{genre: GenreWrapper, padding: number}> = (props) => {
  const {genres, setGenres} = useGenres();
  props = mergeProps({ padding: 0 }, props);
  const toggleGenre = () => {
    if (genres().includes(props.genre.genre.id)) {
      console.log('deselected');
      setGenres(genres().filter(gid => gid != props.genre.genre.id));
    } else {
      console.log('selected');
      let g = [...genres()];
      g.push(props.genre.genre.id);
      setGenres(g);
    }
  };
  const [collapsed, setCollapsed] = createSignal<boolean>(true);
  return (
    <>
      <tr>
        <td class="px-0 py-0">
          <div classList={{ 'bg-slate-50': genres().includes(props.genre.genre.id) }} class={`flex flex-row justify-between px-7 py-4`} style={`margin-left: ${props.padding}px;`}>
            <span onclick={toggleGenre}>{props.genre.genre.name}</span>
            <Show when={!!props.genre.children.length}>
              <span onclick={() => setCollapsed(!collapsed())}>
                <Show when={collapsed()}>
                  <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                  </svg>
                </Show>
                <Show when={!collapsed()}>
                  <svg class="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/>
                  </svg>
                </Show>
              </span>
            </Show>
          </div>
        </td>
      </tr>
      <tr>
        <td class="px-0 py-0">
          <Show when={!collapsed()}>
            <table class="table">
              <tbody>
                <Index each={props.genre.children}>
                  {genre => <GenreListItem genre={genre()} padding={props.padding + 32} />}
                </Index>
              </tbody>
            </table>
          </Show>
        </td>
      </tr>
    </>
  );
};

export default GenreListItem;
export {GenreWrapper};
