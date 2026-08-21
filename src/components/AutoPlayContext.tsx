import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js";

const getInitialAutoPlayNext = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('autoPlayNext');
      if (stored !== null) {
        return stored === 'true';
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return false;
};

const getInitialAutoPlayOnOpen = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('autoPlayOnOpen');
      if (stored !== null) {
        return stored === 'true';
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return false;
};

const [autoPlayNext, _setAutoPlayNext] = createSignal<boolean>(getInitialAutoPlayNext());
const [autoPlayOnOpen, _setAutoPlayOnOpen] = createSignal<boolean>(getInitialAutoPlayOnOpen());

const setAutoPlayNext: Setter<boolean> = ((value: any) => {
  const resolvedValue = typeof value === 'function' ? value(autoPlayNext()) : value;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('autoPlayNext', String(resolvedValue));
    }
  } catch {
    // Ignore localStorage errors
  }
  return _setAutoPlayNext(value);
}) as Setter<boolean>;

const setAutoPlayOnOpen: Setter<boolean> = ((value: any) => {
  const resolvedValue = typeof value === 'function' ? value(autoPlayOnOpen()) : value;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('autoPlayOnOpen', String(resolvedValue));
    }
  } catch {
    // Ignore localStorage errors
  }
  return _setAutoPlayOnOpen(value);
}) as Setter<boolean>;

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
