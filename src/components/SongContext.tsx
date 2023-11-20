import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";
import Song from "../dataclasses/Song";


const [song, setSong] = createSignal<Song | undefined>(undefined, { equals: false });
const ActiveSong = createContext<{song: Accessor<Song | undefined>, setSong: Setter<Song | undefined>}>({song, setSong});

const SongContext: ParentComponent = (props) => {

  const contextData = {song, setSong};
  return (
    <ActiveSong.Provider value={contextData}>
      {props.children}
    </ActiveSong.Provider>
  )
}

const SongConsumer = () => {
  return useContext(ActiveSong);
}

export default SongContext;
export {SongConsumer};
