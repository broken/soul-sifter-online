import { createContext, ParentComponent, useContext } from "solid-js"
import { createStore, SetStoreFunction } from "solid-js/store"

import { Song } from '../model.types'


const Songs = createContext<{songs: Song[], setSongs: SetStoreFunction<Song[]>}>()

const SongsContext: ParentComponent = (props) => {
  const [songs, setSongs] = createStore<Song[]>([])

  const contextData = {songs, setSongs}
  return (
    <Songs.Provider value={contextData}>
      {props.children}
    </Songs.Provider>
  )
}

const useSongs = () => {
  return useContext(Songs)!
}

export default SongsContext
export {useSongs}
