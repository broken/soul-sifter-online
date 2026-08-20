import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js"

export interface FontSizeOption {
  id: string;
  label: string;
  size: string;
}

export const fontSizes: FontSizeOption[] = [
  { id: 'small', label: 'Small', size: '14px' },
  { id: 'medium', label: 'Medium', size: '16px' },
  { id: 'large', label: 'Large', size: '18px' },
  { id: 'xlarge', label: 'Extra Large', size: '20px' },
];

const defaultFontSize = 'medium';
const [fontSize, setFontSize] = createSignal<string>(defaultFontSize);
const FontSize = createContext<{ fontSize: Accessor<string>, setFontSize: Setter<string> }>({ fontSize, setFontSize });

const FontSizeContext: ParentComponent = (props) => {
  const contextData = { fontSize, setFontSize };

  return (
    <FontSize.Provider value={contextData}>
      {props.children}
    </FontSize.Provider>
  );
};

const useFontSize = () => {
  return useContext(FontSize)!;
};

export default FontSizeContext;
export { useFontSize, fontSize, setFontSize };
