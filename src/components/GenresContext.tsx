import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";


const [genres, setGenres] = createSignal<number[]>([]);
const Genres = createContext<{genres: Accessor<number[]>, setGenres: Setter<number[]>}>({genres, setGenres});

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
