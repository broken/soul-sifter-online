import { type Component, createEffect, Index, createSignal, DEV } from 'solid-js'

import { supabase } from './App'
import { Style, StyleChildren } from '../model.types'
import GenreListItem, { GenreWrapper } from './GenreListItem'


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


const GenreList: Component = () => {
  const [genres, setGenres] = createSignal<GenreWrapper[]>([])
  createEffect(async () => {
    let genreList: Style[] = []
    {
      const { data, error } = await supabase.from('styles').select()
      if (error) {
        console.log(error)
      }
      if (data) {
        if (DEV) console.log(data)
        data.forEach((x) => {
          genreList.push(x)
        })
      }
    }
    genreList.sort((a, b) => a.name!.localeCompare(b.name!))

    let children: Record<number, number[]> = {}
    let childIds: Record<number, boolean> = {}
    {
      const { data, error } = await supabase.from('stylechildren').select()
      if (error) {
        console.log(error)
      }
      if (data) {
        if (DEV) console.log(data)
        data.forEach((x: StyleChildren) => {
          if (!children[x.parentid]) children[x.parentid] = []
          children[x.parentid].push(x.childid)
          childIds[x.childid] = true
        })
      }
    }

    let parentGenres: GenreWrapper[] = genreList.filter(g => !childIds[g.id]).map(g => new GenreWrapper(g))
    parentGenres = parentGenres.map(g => addChildren(g, genreList, children))
    setGenres(parentGenres)
    if (DEV) console.log(parentGenres)
  })

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={genres()}>
            {genre => <GenreListItem genre={genre()} padding={0} />}
          </Index>
        </tbody>
      </table>
    </div>
  )
}

export default GenreList
