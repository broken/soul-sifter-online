import { createSignal, type Component, createEffect, onCleanup, on } from 'solid-js'
import { useTheme, darkThemes, lightThemes } from './ThemeContext' // Added import

import logo from '../assets/hires_candidate_2.png'
import styles from './SearchToolbar.module.css'


const [internalSearchQuery, setInternalSearchQuery] = createSignal<string>('')
const [debouncedSearchQuery, setDebouncedSearchQuery] = createSignal<string>('')

const SearchToolbar: Component = () => {
  const { appTheme, setAppTheme } = useTheme(); // Added for theme toggling
  const [inputFocused, setInputFocused] = createSignal<boolean>(false)

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

  return (
    <div class="navbar bg-base-200 gap-2">
      <div class="flex-none justify-between">
        <a class="btn btn-ghost text-xl text-primary" onClick={toggleTheme}>SSO</a> {/* Added onClick */}
      </div>
      <div class="flex-1">
        <input type="text"
            placeholder="Search"
            onInput={(e) => setInternalSearchQuery(e.target.value)}
            class="input input-bordered md:w-auto flex-1"
            classList={{["input-primary"]:inputFocused()}}
            onfocusin={() => setInputFocused(true)} onfocusout={() => setInputFocused(false)}></input>
      </div>
      <div class="flex-none dropdown dropdown-end">
        <label tabIndex={0} class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img src={logo} class={styles.logo} alt="logo" />
          </div>
        </label>
        <ul tabIndex={0} class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-200 rounded-box w-52">
          <li>
            <a class="justify-between">
              Profile
              <span class="badge">New</span>
            </a>
          </li>
          <li><a>{import.meta.env.VITE_APP_VERSION}</a></li>
          <li><a>Logout</a></li>
        </ul>
      </div>
    </div>
  )
}

export default SearchToolbar
export {debouncedSearchQuery}
