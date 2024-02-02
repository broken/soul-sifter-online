import { type Component, createEffect, Index, createSignal, DEV } from 'solid-js';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../App';
import GenreListItem, { GenreWrapper } from './GenreListItem';
import Genre, { genreConverter } from '../dataclasses/Genre';


const addChildren = (genre: GenreWrapper, genres: Genre[]) => {
  for (let g of genres) {
    if (g.parents.includes(genre.genre.id)) {
      let wrapper = new GenreWrapper(g);
      addChildren(wrapper, genres);
      genre.children.push(wrapper);
    }
  }
  return genre;
}


const GenreList: Component = () => {
  const [genres, setGenres] = createSignal<GenreWrapper[]>([]);
  createEffect(async () => {
    const q = query(collection(db, 'genres').withConverter(genreConverter), limit(17));
    const snapshot = await getDocs(q);
    let genreList: Genre[] = []
    snapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      genreList.push(doc.data());
      if (!!DEV) console.log(doc.id, ' => ', doc.data());
    });
    genreList.sort((a, b) => a.name.localeCompare(b.name));
    let parentGenres: GenreWrapper[] = genreList.filter(g => !g.parents.length).map(g => new GenreWrapper(g));
    parentGenres = parentGenres.map(g => addChildren(g, genreList));
    setGenres(parentGenres);
    if (!!DEV) console.log(parentGenres);
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={genres()}>
            {genre => <GenreListItem genre={genre()} />}
          </Index>
        </tbody>
      </table>
    </div>
  );
};

export default GenreList;
