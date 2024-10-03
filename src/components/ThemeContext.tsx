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

const darkThemes: string[] = ['default', 'dark', 'soul', 'sifter', 'black', 'business', 'coffee', 'dracula', 'forest',
    'halloween', 'luxury', 'night', 'synthwave']

const lightThemes: string[] = ['light', 'acid', 'aqua', 'autumn', 'bumblebee', 'cmyk', 'corporate', 'cupcake',
    'cyberpunk', 'emerald', 'fantasy', 'garden', 'lemonade', 'lofi', 'pastel', 'retro', 'winter', 'wireframe']

export default ThemeContext
export {useTheme, darkThemes, lightThemes}
