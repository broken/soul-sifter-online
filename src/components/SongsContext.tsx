import { createContext, ParentComponent, useContext } from "solid-js"
import { createStore, SetStoreFunction } from "solid-js/store"
import { Tables } from '../database.types'


const Songs = createContext<{songs: Tables<'songs'>[], setSongs: SetStoreFunction<Tables<'songs'>[]>}>()

const SongsContext: ParentComponent = (props) => {
  const [songs, setSongs] = createStore<Tables<'songs'>[]>([])

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
