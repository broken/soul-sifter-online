import { type Component, createEffect, Index, createSignal, DEV } from 'solid-js';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../App';
import Genre, { genreConverter } from '../dataclasses/Genre';


const GenreList: Component = () => {
  const [genres, setGenres] = createSignal<Genre[]>([]);
  createEffect(async () => {
    const q = query(collection(db, 'genres').withConverter(genreConverter));
    const snapshot = await getDocs(q);
    let genreList: Genre[] = []
    snapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      genreList.push(doc.data());
      if (!!DEV) console.log(doc.id, ' => ', doc.data());
    });
    setGenres(genreList);
    if (!!DEV) console.log(genreList);
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={genres()}>
            {genre => (
              <tr>
              <td class="flex flex-row justify-between px-6 py-3">
                <span>
                  <span><b>{genre().name}</b></span>
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

export default GenreList;
