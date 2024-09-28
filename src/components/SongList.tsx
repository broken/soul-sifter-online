import { type Component, createEffect, Index, DEV, Show } from 'solid-js';
import SongListItem from './SongListItem';
import { supabase } from '../App';
import { searchQuery } from './SearchToolbar';
import { selectedPlaylist, setSelectedPlaylist } from './PlaylistList';
import { useGenres } from './GenresContext';
import { useSongs } from './SongsContext';
import { Tables } from '../database.types';
import { searchSongs, OrderBy } from './SearchUtil';


const SongList: Component = () => {
  const {genres, setGenres} = useGenres();
  const {songs, setSongs} = useSongs();
  createEffect(async () => {
    console.log("is dev: ", DEV);
    let songResults = await searchSongs(
      searchQuery(),
      !DEV ? 20 : 3 /* limit */,
      0 /* bpm */,
      '' /* key */,
      genres(),
      [] /* songs to omit */,
      []  /* playlists */,
      0 /* energy */,
      OrderBy.DATE_ADDED,
      undefined /* callback */
    );
    setSongs(songResults);
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
    <Show when={!!genres.length}>
      <div role="alert" class="alert bg-neutral">
      <div class="grid-flow-col justify-items-start text-start grid w-full content-start items-center gap-4" style="grid-template-columns: auto minmax(auto,1fr);">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {/* <span>Genre {genres[0].name} ({genres[0].id}).</span> */}
          <button class="btn btn-sm btn-primary" onclick={() => setGenres([])}>Clear</button>
        </div>
      </div>
    </Show>
      <Show when={!!selectedPlaylist()}>
        <div role="alert" class="alert bg-neutral">
          <div class="grid-flow-col justify-items-start text-start grid w-full content-start items-center gap-4" style="grid-template-columns: auto minmax(auto,1fr);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Playlist {selectedPlaylist()?.name}.</span>
            <button class="btn btn-sm btn-primary" onclick={() => setSelectedPlaylist(undefined)}>Remove</button>
          </div>
        </div>
      </Show>
      <table class="table">
        <tbody>
          <Index each={songs}>
            {song => <SongListItem song={song()} />}
          </Index>
        </tbody>
      </table>
    </div>
  );
};

export default SongList;
