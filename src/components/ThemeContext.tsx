import { Accessor, createContext, createSignal, ParentComponent, Setter, useContext } from "solid-js"

// Moved darkThemes and lightThemes to the top
const darkThemes: string[] = ['default', 'dark', 'soul', 'sifter', 'black', 'business', 'coffee', 'dracula', 'forest',
    'halloween', 'luxury', 'night', 'synthwave']

const lightThemes: string[] = ['light', 'acid', 'aqua', 'autumn', 'bumblebee', 'cmyk', 'corporate', 'cupcake',
    'cyberpunk', 'emerald', 'fantasy', 'garden', 'lemonade', 'lofi', 'pastel', 'retro', 'winter', 'wireframe']

const initialRandomTheme = darkThemes[Math.floor(Math.random() * darkThemes.length)];
const [appTheme, setAppTheme] = createSignal<string>(initialRandomTheme)
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

export default ThemeContext
// Export appTheme for testing purposes
export {useTheme, darkThemes, lightThemes, appTheme}
