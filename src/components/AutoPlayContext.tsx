import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";

const [autoPlayNext, setAutoPlayNext] = createSignal<boolean>(false);
const AutoPlay = createContext<{
  autoPlayNext: Accessor<boolean>;
  setAutoPlayNext: Setter<boolean>;
}>({ autoPlayNext, setAutoPlayNext });

const AutoPlayContext: ParentComponent = (props) => {
  const contextData = { autoPlayNext, setAutoPlayNext };

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
export { useAutoPlay, autoPlayNext, setAutoPlayNext };
