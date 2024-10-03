import { Suspense, type Component, Switch, Match, createSignal, useTransition } from 'solid-js'
import { createClient } from '@supabase/supabase-js'

import GenresContext from './components/GenresContext'
import GenreList from './components/GenreList'
import NavBar from './components/NavBar'
import ActivePlaylistContext from './components/PlaylistContext'
import PlaylistList from './components/PlaylistList'
import SearchToolbar from './components/SearchToolbar'
import Settings from './components/Settings'
import SongContext from './components/SongContext'
import SongInfo from './components/SongInfo'
import SongList from './components/SongList'
import SongsContext from './components/SongsContext'


// Initialize supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


const App: Component = () => {
  const [tab, setTab] = createSignal(0)
  const [pending, start] = useTransition()
  return (
    <GenresContext><ActivePlaylistContext><SongContext><SongsContext>
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
        <NavBar start={start} setTab={setTab}/>
      </div>
    </SongsContext></SongContext></ActivePlaylistContext></GenresContext>
  )
}

export default App
export {supabase}
