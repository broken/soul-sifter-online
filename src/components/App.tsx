import { Suspense, type Component, Switch, Match, createSignal, useTransition, onMount } from 'solid-js' // Added onMount
import { createClient } from '@supabase/supabase-js'

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


const App: Component = () => {
  const [tab, setTab] = createSignal(0)
  const [pending, start] = useTransition()

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('youtube_auth_status');
    const errorMessage = urlParams.get('error_message'); // Changed from error_message to error_message for consistency
    const message = urlParams.get('message'); // Optional success message from callback

    if (authStatus === 'success') {
      localStorage.setItem('youtubeConnected', 'true');
      // Dispatch a custom event to notify other components like NavBar immediately
      window.dispatchEvent(new CustomEvent('youtubeConnectionChanged', { detail: { connected: true } }));

      const successMessage = message || 'YouTube account linked successfully! If this was the first time, ensure the refresh token from the function logs has been saved as a Supabase secret.';
      alert(successMessage);
      // Clean the URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === 'error') {
      localStorage.removeItem('youtubeConnected');
      // Dispatch a custom event to notify other components like NavBar immediately
      window.dispatchEvent(new CustomEvent('youtubeConnectionChanged', { detail: { connected: false } }));

      alert(`Failed to link YouTube account: ${errorMessage || 'Unknown error'}`);
      // Clean the URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });

  return (
    <GenresContext><ActivePlaylistContext><SongContext><SongsContext><ThemeContext>
      <div class="flex flex-col h-screen w-screen overflow-hidden">
        <SearchToolbar />
        <div class="tab px-0" classList={{ pending: pending() }}>
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
    </ThemeContext></SongsContext></SongContext></ActivePlaylistContext></GenresContext>
  )
}

export default App
export {supabase}
