import { createSignal, type Component, createEffect, onCleanup, on } from 'solid-js'
import { useTheme, darkThemes, lightThemes } from './ThemeContext' // Added import

import logo from '../assets/hires_candidate_2.png'
import styles from './SearchToolbar.module.css'
import QueryBuilderModal from './QueryBuilderModal'


const [internalSearchQuery, setInternalSearchQuery] = createSignal<string>('')
const [debouncedSearchQuery, setDebouncedSearchQuery] = createSignal<string>('')

const SearchToolbar: Component = () => {
  const { appTheme, setAppTheme } = useTheme(); // Added for theme toggling
  const [inputFocused, setInputFocused] = createSignal<boolean>(false)
  const [isQueryBuilderOpen, setIsQueryBuilderOpen] = createSignal<boolean>(false)

  const toggleTheme = () => { // Added theme toggle function
    const currentTheme = appTheme();
    if (darkThemes.includes(currentTheme)) {
      const randomLightTheme = lightThemes[Math.floor(Math.random() * lightThemes.length)];
      setAppTheme(randomLightTheme);
    } else {
      const randomDarkTheme = darkThemes[Math.floor(Math.random() * darkThemes.length)];
      setAppTheme(randomDarkTheme);
    }
  };

  createEffect(on(internalSearchQuery, (currentQuery) => {
    let timerId: number;

    onCleanup(() => {
      clearTimeout(timerId);
    });

    timerId = setTimeout(() => {
      setDebouncedSearchQuery(currentQuery);
    }, 3000);
  }, { defer: true }));

  const handleApplyQuery = (newQuery: string) => {
    setInternalSearchQuery(newQuery);
    setDebouncedSearchQuery(newQuery);
  };

  return (
    <>
      <div class="navbar bg-base-200 gap-2">
        <div class="flex-none justify-between">
          <a class="btn btn-ghost text-xl text-primary" onClick={toggleTheme}>SSO</a> {/* Added onClick */}
        </div>
        <div class="flex-1">
          <input
            type="text"
            placeholder="Search"
            value={internalSearchQuery()}
            onInput={(e) => setInternalSearchQuery(e.target.value)}
            class="input input-bordered md:w-auto flex-1 w-full"
            classList={{["input-primary"]:inputFocused()}}
            onfocusin={() => setInputFocused(true)}
            onfocusout={() => setInputFocused(false)}
          />
        </div>
        <div class="flex-none">
          <button
            type="button"
            class="btn btn-ghost btn-circle avatar"
            onClick={() => setIsQueryBuilderOpen(true)}
            title="Open Query Builder"
            aria-label="Open Query Builder"
          >
            <div class="w-10 rounded-full">
              <img src={logo} class={styles.logo} alt="Query Builder" />
            </div>
          </button>
        </div>
      </div>
      <QueryBuilderModal
        isOpen={isQueryBuilderOpen()}
        initialQuery={internalSearchQuery()}
        onClose={() => setIsQueryBuilderOpen(false)}
        onApply={handleApplyQuery}
      />
    </>
  )
}

export default SearchToolbar
export {debouncedSearchQuery, internalSearchQuery, setInternalSearchQuery, setDebouncedSearchQuery}

