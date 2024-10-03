import { ImStarEmpty, ImStarFull } from 'solid-icons/im'
import { For, type Component, Show, mergeProps } from "solid-js"
import { produce } from "solid-js/store"

import { supabase } from "../App"
import { Song } from '../model.types'
import { SongConsumer } from "./SongContext"
import { useSongs } from './SongsContext'

const Rating: Component<{song: Song | undefined, mutable: boolean}> = (props) => {
  props = mergeProps({ mutable: false }, props)
  const {setSong} = SongConsumer()
  const {songs, setSongs} = useSongs()

  let setRating = async (rating: number) => {
    if (!props.song) {
      console.error('Trying to set rating of an undefined song.')
      return
    }
    let song = {...props.song}
    song.rating = rating
    setSong(song)
    setSongs(
        (s: Song) => s.id ===  song?.id,
        produce((s: Song) => s.rating = rating)
    )
    let updateSongPromise = supabase.from('songs').update({ rating: rating }).eq('id', song.id)
    let insertChangePromise = supabase.from('changes').insert({
      key: song.id,
      table: 'songs',
      field: 'rating',
      value: song.rating
    })
    {
      const { error } = await updateSongPromise
      if (error) console.error(error)
    }
    {
      const { error } = await insertChangePromise
      if (error) console.error(error)
    }
  }

  return (
    <span class="flex flex-row text-primary items-center">
      <For each={[...Array(5).keys()]}>
        {
          (i) => {
            return (
              <Show when={i < (props.song?.rating || 0)} fallback={<ImStarEmpty onclick={() => props.mutable ? setRating(i+1) : ''} />}>
                <ImStarFull onclick={() => props.mutable ? setRating(i+1) : ''} class="fill-secondary"/>
              </Show>
            )
          }
        }
      </For>
    </span>
  )
}

export default Rating
