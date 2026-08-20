import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";

const [autoPlayNext, setAutoPlayNext] = createSignal<boolean>(false);
const [autoPlayOnOpen, setAutoPlayOnOpen] = createSignal<boolean>(false);
const AutoPlay = createContext<{
  autoPlayNext: Accessor<boolean>;
  setAutoPlayNext: Setter<boolean>;
  autoPlayOnOpen: Accessor<boolean>;
  setAutoPlayOnOpen: Setter<boolean>;
}>({ autoPlayNext, setAutoPlayNext, autoPlayOnOpen, setAutoPlayOnOpen });

const AutoPlayContext: ParentComponent = (props) => {
  const contextData = { autoPlayNext, setAutoPlayNext, autoPlayOnOpen, setAutoPlayOnOpen };

  return (
    <AutoPlay.Provider value={contextData}>
      {props.children}
    </AutoPlay.Provider>
  );
};

const useAutoPlay = () => {
  return useContext(AutoPlay)!;
};

export default AutoPlayContext;
export { useAutoPlay, autoPlayNext, setAutoPlayNext, autoPlayOnOpen, setAutoPlayOnOpen };
