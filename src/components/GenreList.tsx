import { type Component, Index, DEV, createResource, Show } from 'solid-js'

import { supabase } from './App'
import { Style, StyleChildren } from '../model.types'
import GenreListItem, { GenreWrapper } from './GenreListItem'

const fetchGenres = async () => {
  const addChildren = (genre: GenreWrapper, genres: Style[], children: Record<number, number[]>) => {
    for (let g of genres) {
      if (children[genre.genre.id] && children[genre.genre.id].includes(g.id)) {
        let wrapper = new GenreWrapper(g)
        addChildren(wrapper, genres, children)
        genre.children.push(wrapper)
      }
    }
    return genre
  }

  let genreList: Style[] = []
  const { data: stylesData, error: stylesError } = await supabase.from('styles').select()
  if (stylesError) {
    console.error(stylesError)
    throw stylesError
  }
  if (stylesData) {
    if (DEV) console.log(stylesData)
    genreList = stylesData
  }
  genreList.sort((a, b) => a.name!.localeCompare(b.name!))

  let children: Record<number, number[]> = {}
  let childIds: Record<number, boolean> = {}
  const { data: styleChildrenData, error: styleChildrenError } = await supabase.from('stylechildren').select()
  if (styleChildrenError) {
    console.error(styleChildrenError)
    throw styleChildrenError
  }
  if (styleChildrenData) {
    if (DEV) console.log(styleChildrenData)
    styleChildrenData.forEach((x: StyleChildren) => {
      if (!children[x.parentid]) children[x.parentid] = []
      children[x.parentid].push(x.childid)
      childIds[x.childid] = true
    })
  }

  let parentGenres: GenreWrapper[] = genreList.filter(g => !childIds[g.id]).map(g => new GenreWrapper(g))
  parentGenres = parentGenres.map(g => addChildren(g, genreList, children))
  if (DEV) console.log(parentGenres)
  return parentGenres
}

const GenreList: Component = () => {
  const [genres] = createResource<GenreWrapper[]>(fetchGenres)

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <Show when={!genres.loading && !genres.error} fallback={<div>Loading genres...</div>}>
        <Show when={genres.error}>
          <div>Error loading genres: {genres.error.message}</div>
        </Show>
        <table class="table">
          <tbody>
            <Index each={genres()}>
              {genre => <GenreListItem genre={genre()} padding={0} />}
            </Index>
          </tbody>
        </table>
      </Show>
    </div>
  )
}

export default GenreList
