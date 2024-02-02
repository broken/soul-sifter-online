import { type Component, createEffect, Index, createSignal, DEV } from 'solid-js';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../App';
import Playlist, { playlistConverter } from '../dataclasses/Playlist';


const PlaylistList: Component = () => {
  const [playlists, setPlaylists] = createSignal<Playlist[]>([]);
  createEffect(async () => {
    const q = query(collection(db, 'playlists').withConverter(playlistConverter));
    const snapshot = await getDocs(q);
    let playlistList: Playlist[] = []
    snapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      playlistList.push(doc.data());
      if (!!DEV) console.log(doc.id, ' => ', doc.data());
    });
    playlistList.sort((a, b) => a.name.localeCompare(b.name));
    setPlaylists(playlistList);
    if (!!DEV) console.log(playlistList);
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={playlists()}>
            {playlist => (
              <tr>
              <td class="flex flex-row justify-between px-6 py-3">
                <span>
                  <span><b>{playlist().name}</b></span>
                </span>
              </td>
            </tr>
            )}
          </Index>
        </tbody>
      </table>
    </div>
  );
};

export default PlaylistList;
