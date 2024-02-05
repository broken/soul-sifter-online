import { type Component, createEffect, Index, DEV, Show } from 'solid-js';
import SongListItem from './SongListItem';
import { collection, doc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../App';
import { searchField, searchQuery } from './SearchToolbar';
import { selectedGenres, setSelectedGenres } from './GenreListItem';
import { selectedPlaylist, setSelectedPlaylist } from './PlaylistList';
import { SongsConsumer } from './SongsContext';
import Song, { songConverter } from '../dataclasses/Song';
import Playlist from '../dataclasses/Playlist';
import { playlistEntryConverter } from '../dataclasses/PlaylistEntry';


const SongList: Component = () => {
  const {songs, setSongs} = SongsConsumer();
  createEffect(async () => {
    console.log("is dev: ", DEV);
    let max = !DEV ? 20 : 3;
    let q = undefined;
    if (!!searchQuery()) {
      q = query(collection(db, 'songs').withConverter(songConverter), where(searchField(), '>=', searchQuery()), where(searchField(), '<=', searchQuery()+'\uf8ff'), limit(max));
    } else if (!!selectedGenres().length) {
      q = query(collection(db, 'songs').withConverter(songConverter), where(`genres.${selectedGenres()[0].id.toString()}`, '!=', null), limit(max));
    } else if (!!selectedPlaylist()) {
      let playlist = selectedPlaylist() as Playlist;
      if (!!playlist.query) return;
      if (!playlist.entries.length) {
        let eq = query(collection(doc(db, 'playlists', playlist.id.toString()), 'entries').withConverter(playlistEntryConverter));
        const esnapshot = await getDocs(eq);
        esnapshot.forEach((doc) => {
          playlist.entries.push(doc.data());
        });
        playlist.entries.sort((a, b) => a.position - b.position);
      }
      q = query(collection(db, 'songs').withConverter(songConverter), where("__name__", "in", playlist.entries.map(e => e.id.toString())), limit(max))
    } else {
      q = query(collection(db, 'songs').withConverter(songConverter), limit(max));
    }
    const snapshot = await getDocs(q);
    let songList: Song[] = []
    snapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      songList.push(doc.data());
      if (!!DEV) console.log(doc.id, ' => ', doc.data());
    });
    setSongs(songList);
    if (!!DEV) console.log(songList);
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
    <Show when={!!selectedGenres().length}>
      <div role="alert" class="alert bg-neutral">
      <div class="grid-flow-col justify-items-start text-start grid w-full content-start items-center gap-4" style="grid-template-columns: auto minmax(auto,1fr);">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Genre {selectedGenres()[0].name} ({selectedGenres()[0].id}).</span>
          <button class="btn btn-sm btn-primary" onclick={() => setSelectedGenres([])}>Clear</button>
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
