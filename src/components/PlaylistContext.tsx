import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";
import { Tables } from '../database.types';


const [activePlaylist, setActivePlaylist] = createSignal<Tables<'playlists'> | undefined>();
const ActivePlaylist = createContext<{activePlaylist: Accessor<Tables<'playlists'> | undefined>, setActivePlaylist: Setter<Tables<'playlists'> | undefined>}>({activePlaylist, setActivePlaylist});

const ActivePlaylistContext: ParentComponent = (props) => {

  const contextData = {activePlaylist, setActivePlaylist};
  return (
    <ActivePlaylist.Provider value={contextData}>
      {props.children}
    </ActivePlaylist.Provider>
  )
}

const useActivePlaylist = () => {
  return useContext(ActivePlaylist);
}

export default ActivePlaylistContext;
export {useActivePlaylist};
