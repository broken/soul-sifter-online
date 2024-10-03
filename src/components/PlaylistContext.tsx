import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js"

import { Playlist } from '../model.types'


const [activePlaylist, setActivePlaylist] = createSignal<Playlist | undefined>()
const ActivePlaylist = createContext<{activePlaylist: Accessor<Playlist | undefined>, setActivePlaylist: Setter<Playlist | undefined>}>({activePlaylist, setActivePlaylist})

const ActivePlaylistContext: ParentComponent = (props) => {

  const contextData = {activePlaylist, setActivePlaylist}
  return (
    <ActivePlaylist.Provider value={contextData}>
      {props.children}
    </ActivePlaylist.Provider>
  )
}

const useActivePlaylist = () => {
  return useContext(ActivePlaylist)
}

export default ActivePlaylistContext
export {useActivePlaylist}
