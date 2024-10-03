import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js"

import { Style } from "../model.types.js"


const [activeGenres, setActiveGenres] = createSignal<Style[]>([])
const Genres = createContext<{activeGenres: Accessor<Style[]>, setActiveGenres: Setter<Style[]>}>({activeGenres, setActiveGenres})

const GenresContext: ParentComponent = (props) => {
  const contextData = {activeGenres, setActiveGenres}

  return (
    <Genres.Provider value={contextData}>
      {props.children}
    </Genres.Provider>
  )
};

const useGenres = () => {
  return useContext(Genres)
};

export default GenresContext
export {useGenres}
