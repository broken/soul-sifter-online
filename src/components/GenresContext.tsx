import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";
import { Tables } from '../database.types';


const [genres, setGenres] = createSignal<Tables<'styles'>[]>([]);
const Genres = createContext<{genres: Accessor<Tables<'styles'>[]>, setGenres: Setter<Tables<'styles'>[]>}>({genres, setGenres});

const GenresContext: ParentComponent = (props) => {

  const contextData = {genres, setGenres};
  return (
    <Genres.Provider value={contextData}>
      {props.children}
    </Genres.Provider>
  )
}

const useGenres = () => {
  return useContext(Genres);
}

export default GenresContext;
export {useGenres};
