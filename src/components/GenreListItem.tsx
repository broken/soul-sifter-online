import { Index, type Component, createSignal, Show, mergeProps } from 'solid-js'
import { createMutable } from 'solid-js/store'

import { Style } from "../model.types"
import { useGenres } from './GenresContext'
import styles from './GenreListItem.module.css'


class GenreWrapper {
  genre: Style
  children: GenreWrapper[]

  constructor(genre: Style, children: GenreWrapper[] = []) {
    this.genre = genre
    this.children = children
    return createMutable(this)
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


const GenreListItem: Component<{genre: GenreWrapper, padding: number}> = (props) => {
  const {activeGenres, setActiveGenres} = useGenres()
  const [collapsed, setCollapsed] = createSignal<boolean>(true)

  props = mergeProps({ padding: 0 }, props)

  const toggleGenre = () => {
    if (activeGenres().some(g => g.id === props.genre.genre.id)) {
      console.log('deselected')
      setActiveGenres(activeGenres().filter(g => g.id !== props.genre.genre.id))
    } else {
      console.log('selected')
      let g = [...activeGenres()]
      g.push(props.genre.genre)
      setActiveGenres(g)
    }
  }

  return (
    <>
      <tr>
        <td class="px-0 py-0">
          <div classList={{ [styles.active]: activeGenres().some(g => g.id === props.genre.genre.id) }} class={`flex flex-row justify-between px-7 py-4`} style={`margin-left: ${props.padding}px;`}>
            <span onclick={toggleGenre}>{props.genre.genre.name}</span>
            <Show when={!!props.genre.children.length}>
              <span onclick={() => setCollapsed(!collapsed())}>
                <Show when={collapsed()}>
                  <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                  </svg>
                </Show>
                <Show when={!collapsed()}>
                  <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  )
}

export default GenreListItem
export {GenreWrapper}
