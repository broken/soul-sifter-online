import { Index, type Component, createSignal, Show, mergeProps } from 'solid-js'
import { createMutable } from 'solid-js/store'

import { Style } from "../model.types"
import { useGenres } from './GenresContext'
import styles from './GenreListItem.module.css'


class GenreWrapper {
  genre: Style
  children: GenreWrapper[]
  collapsed: boolean

  constructor(genre: Style, children: GenreWrapper[] = []) {
    this.genre = genre
    this.children = children
    this.collapsed = true
    return createMutable(this)
  }

  getAllDescendants(): Style[] {
    const descendants: Style[] = []
    for (const child of this.children) {
      descendants.push(child.genre)
      descendants.push(...child.getAllDescendants())
    }
    return descendants
  }

  getAllDescendantWrappers(): GenreWrapper[] {
    const descendantWrappers: GenreWrapper[] = []
    for (const childWrapper of this.children) {
      descendantWrappers.push(childWrapper)
      descendantWrappers.push(...childWrapper.getAllDescendantWrappers())
    }
    return descendantWrappers
  }

  toString() {
    let s = `${this.genre} (`
    for (let child of this.children) {
      s += child.toString() + ", "
    }
    s += ')'
    return s
  }
}


const [genreToEdit, setGenreToEdit] = createSignal<Style|undefined>(undefined)


const GenreListItem: Component<{genre: GenreWrapper, padding: number}> = (props) => {
  const {activeGenres, setActiveGenres} = useGenres()

  // Create a derived signal for the active state
  const isActive = () => activeGenres().some(g => g.id === props.genre.genre.id);

  props = mergeProps({ padding: 0 }, props)

  // toggleGenre function remains the same as defined in the prompt (the one that correctly updates activeGenres and children)
  const toggleGenre = () => {
    const isCurrentlyActive = isActive();
    const parentGenre = props.genre.genre;
    const allDescendants = props.genre.getAllDescendants(); // Get all descendants

    if (isCurrentlyActive) {
      console.log('deselected', parentGenre.name);
      const idsToDeselect = [parentGenre.id];
      allDescendants.forEach(descendant => idsToDeselect.push(descendant.id));
      setActiveGenres(activeGenres().filter(g => !idsToDeselect.includes(g.id)));
    } else {
      console.log('selected', parentGenre.name);
      props.genre.collapsed = false; // Expand the parent genre by setting its collapsed property

      // Expand all descendant GenreWrappers
      const descendantWrappers = props.genre.getAllDescendantWrappers(); // Returns GenreWrapper[]
      descendantWrappers.forEach(wrapper => {
        wrapper.collapsed = false;
      });

      let newActiveGenres = [...activeGenres()];

      // Add parent genre
      if (!newActiveGenres.some(g => g.id === parentGenre.id)) {
        newActiveGenres.push(parentGenre);
      }

      // Add all descendant genres
      allDescendants.forEach(descendant => {
        if (!newActiveGenres.some(g => g.id === descendant.id)) {
          newActiveGenres.push(descendant);
        }
      });
      setActiveGenres(newActiveGenres);
    }
  };

  return (
    <>
      <tr>
        <td class="px-0 py-0">
          {/* Use the new isActive derived signal in classList */}
          <div onclick={toggleGenre} classList={{ [styles.active]: isActive() }} class={`flex flex-row justify-between items-center px-7 py-4 cursor-pointer`} style={`margin-left: ${props.padding}px;`}>
            {/* Genre Name - always on the left */}
            <span>{props.genre.genre.name}</span>

            {/* Icons Group - always on the right */}
            <div class="flex items-center">
              <span
                onclick={(event) => { event.stopPropagation(); setGenreToEdit(props.genre.genre); }}
                class="cursor-pointer hover:opacity-70"
                classList={{ "mr-2": !!props.genre.children.length && props.genre.children.length > 0 }} // Margin right if expand arrow is present
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              <Show when={!!props.genre.children.length && props.genre.children.length > 0}>
                <span onclick={(event) => { event.stopPropagation(); props.genre.collapsed = !props.genre.collapsed; }} class="cursor-pointer">
                  <Show when={props.genre.collapsed}>
                    <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                    </svg>
                  </Show>
                  <Show when={!props.genre.collapsed}>
                    <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 15 7-7 7 7"/>
                    </svg>
                  </Show>
                </span>
              </Show>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="px-0 py-0">
          <Show when={!props.genre.collapsed}>
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
  )
}

export default GenreListItem
export {GenreWrapper, genreToEdit, setGenreToEdit}
