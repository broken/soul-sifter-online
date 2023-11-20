import { createContext, ParentComponent, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import Song from "../dataclasses/Song";


const Songs = createContext<{songs: Song[], setSongs: SetStoreFunction<Song[]>}>();

const SongsContext: ParentComponent = (props) => {
  const [songs, setSongs] = createStore<Song[]>([]);

  const contextData = {songs, setSongs}
  return (
    <Songs.Provider value={contextData}>
      {props.children}
    </Songs.Provider>
  )
}

const SongsConsumer = () => {
  return useContext(Songs)!;
}

export default SongsContext;
export {SongsConsumer};
