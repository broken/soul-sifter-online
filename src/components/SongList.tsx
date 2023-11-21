import { type Component, createEffect, Index } from 'solid-js';
import SongListItem from './SongListItem';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../App';
import styles from './SongList.module.css';
import { searchField, searchQuery } from './SearchToolbar';
import { SongsConsumer } from './SongsContext';
import Song, { songConverter } from '../dataclasses/Song';


const SongList: Component = () => {
  const {songs, setSongs} = SongsConsumer();
  createEffect(async () => {
    const q = !!searchQuery()
        ? query(collection(db, 'songs').withConverter(songConverter), where(searchField(), '>=', searchQuery()), where(searchField(), '<=', searchQuery()+'\uf8ff'), limit(6))
        : query(collection(db, 'songs').withConverter(songConverter), limit(6));
    const snapshot = await getDocs(q);
    let songList: Song[] = []
    snapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      songList.push(doc.data());
      console.log(doc.id, ' => ', doc.data());
    });
    setSongs(songList);
    console.log(songList);
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll">
      <table class="table table-pin-rows">
        {/* head */}
        <thead>
          <tr>
            <th class="flex flex-row justify-between">
              <span>track</span>
              <span>rating</span>
            </th>
          </tr>
        </thead>
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
