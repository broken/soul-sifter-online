import { createSignal, type Component } from 'solid-js'

import logo from '../assets/hires_candidate_2.png'
import styles from './SearchToolbar.module.css'


const [searchQuery, setSearchQuery] = createSignal<string>('')

const SearchToolbar: Component = () => {
  const [inputFocused, setInputFocused] = createSignal<boolean>(false)
  return (
    <div class="navbar bg-base-300">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">Soul Sifter Online</a>
      </div>
      <div class="flex-none gap-2">
        <div>
          <input type="text"
              placeholder="Search"
              onInput={(e) => setSearchQuery(e.target.value)}
              class="input input-bordered md:w-auto flex-1"
              classList={{["input-primary"]:inputFocused()}}
              onfocusin={() => setInputFocused(true)} onfocusout={() => setInputFocused(false)}></input>
        </div>
        <div class="dropdown dropdown-end">
          <label tabIndex={0} class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full">
              <img src={logo} class={styles.logo} alt="logo" />
            </div>
          </label>
          <ul tabIndex={0} class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li>
              <a class="justify-between">
                Profile
                <span class="badge">New</span>
              </a>
            </li>
            <li><a>Settings</a></li>
            <li><a>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SearchToolbar
export {searchQuery}
