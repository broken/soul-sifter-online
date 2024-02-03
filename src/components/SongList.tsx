import { type Component, createEffect, Index, DEV } from 'solid-js';
import SongListItem from './SongListItem';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../App';
import { searchField, searchQuery } from './SearchToolbar';
import { selectedGenres } from './GenreListItem';
import { SongsConsumer } from './SongsContext';
import Song, { songConverter } from '../dataclasses/Song';


const SongList: Component = () => {
  const {songs, setSongs} = SongsConsumer();
  createEffect(async () => {
    console.log("is dev: ", DEV);
    let max = !DEV ? 20 : 3;
    let q = undefined;
    if (!!searchQuery()) {
      q = query(collection(db, 'songs').withConverter(songConverter), where(searchField(), '>=', searchQuery()), where(searchField(), '<=', searchQuery()+'\uf8ff'), limit(max))
    } else if (!!selectedGenres().length) {
      q = query(collection(db, 'songs').withConverter(songConverter), where(`genres.${selectedGenres()[0].toString()}`, '!=', null), limit(max))
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
