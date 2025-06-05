import { Suspense, type Component, Switch, Match, createSignal, useTransition, createEffect } from 'solid-js' // Added createEffect
import { createClient } from '@supabase/supabase-js'

import { useTheme } from './ThemeContext' // Added useTheme
import GenresContext from './GenresContext'
import GenreInfo from './GenreInfo'
import GenreList from './GenreList'
import NavBar from './NavBar'
import ActivePlaylistContext from './PlaylistContext'
import PlaylistList from './PlaylistList'
import SearchToolbar from './SearchToolbar'
import Settings from './Settings'
import SongContext from './SongContext'
import SongInfo from './SongInfo'
import SongList from './SongList'
import SongsContext from './SongsContext'
import ThemeContext from './ThemeContext'


// Initialize supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


// Define the main view as a separate component to use useTheme
const AppView: Component = () => {
  const [tab, setTab] = createSignal(0)
  const [pending, start] = useTransition()
  const { appTheme } = useTheme(); // Moved from Settings.tsx

  createEffect(() => { // Moved from Settings.tsx
    document.documentElement.setAttribute("data-theme", appTheme());
  });

  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden">
      <SearchToolbar />
      {/* Added flex-1 and overflow-auto to the tab container */}
      <div class="tab px-0 flex-1 overflow-auto" classList={{ pending: pending() }}>
        <Suspense fallback={<div class="loader">Loading...</div>}>
          <Switch>
            <Match when={tab() === 0}>
              <SongList />
            </Match>
            <Match when={tab() === 1}>
              <GenreList />
            </Match>
            <Match when={tab() === 2}>
              <PlaylistList />
            </Match>
            <Match when={tab() === 3}>
              <Settings />
            </Match>
          </Switch>
        </Suspense>
      </div>
      <SongInfo />
      <GenreInfo />
      <NavBar start={start} setTab={setTab}/>
    </div>
  );
};

const App: Component = () => {
  return (
    <GenresContext>
      <ActivePlaylistContext>
        <SongContext>
          <SongsContext>
            <ThemeContext> {/* ThemeContext provider */}
              <AppView /> {/* AppView is now a child of ThemeContext */}
            </ThemeContext>
          </SongsContext>
        </SongContext>
      </ActivePlaylistContext>
    </GenresContext>
  );
};

export default App
export {supabase}
