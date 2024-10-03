import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js"


const [appTheme, setAppTheme] = createSignal<string>('dark')
const Theme = createContext<{appTheme: Accessor<string>, setAppTheme: Setter<string>}>({appTheme, setAppTheme})

const ThemeContext: ParentComponent = (props) => {
  const contextData = {appTheme, setAppTheme}

  return (
    <Theme.Provider value={contextData}>
      {props.children}
    </Theme.Provider>
  )
}

const useTheme = () => {
  return useContext(Theme)!
}

const themes: string[] = ['default', 'light', 'dark', 'soul', 'sifter', 'acid', 'aqua', 'autumn', 'black', 'bumblebee', 'business',
  'cmyk', 'coffee', 'corporate', 'cupcake', 'cyberpunk', 'dracula', 'emerald', 'fantasy', 'forest', 'garden',
  'halloween', 'lemonade', 'lofi', 'luxury', 'night', 'pastel', 'retro', 'synthwave', 'winter', 'wireframe']

export default ThemeContext
export {useTheme, themes}
