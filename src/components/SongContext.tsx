import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";
import { Tables } from '../database.types';


const [song, setSong] = createSignal<Tables<'songs'> | undefined>(undefined, { equals: false });
const ActiveSong = createContext<{song: Accessor<Tables<'songs'> | undefined>, setSong: Setter<Tables<'songs'> | undefined>}>({song, setSong});

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
