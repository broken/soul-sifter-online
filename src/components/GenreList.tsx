import { type Component, createEffect, Index, createSignal, DEV } from 'solid-js';
import { supabase } from '../App';
import GenreListItem, { GenreWrapper } from './GenreListItem';
import { Tables } from '../database.types';


const addChildren = (genre: GenreWrapper, genres: Tables<'styles'>[]) => {
  for (let g of genres) {
    // if (g.parents.includes(genre.genre.id)) {
    //   let wrapper = new GenreWrapper(g);
    //   addChildren(wrapper, genres);
    //   genre.children.push(wrapper);
    // }
  }
  return genre;
}


const GenreList: Component = () => {
  const [genres, setGenres] = createSignal<GenreWrapper[]>([]);
  createEffect(async () => {
    let genreList: Tables<'styles'>[] = []
    const { data, error } = await supabase.from('styles').select();
    if (error) {
      console.log(error);
    }
    if (data) {
      if (DEV) console.log(data);
      data.forEach((x) => {
        genreList.push(x);
      })
    }
    genreList.sort((a, b) => a.name!.localeCompare(b.name!));

    // let genreChildrenList: Tables<'stylechildren'>[] = []
    // const { data2, error2 } = await supabase.from('stylechildren').select();
    // if (error2) {
    //   console.log(error2);
    // }
    // if (data2) {
    //   if (DEV) console.log(data2);
    //   data2.forEach((x) => {
    //     genreChildrenList.push(x);
    //   })
    // }
    // let parentGenres: GenreWrapper[] = genreList.filter(g => !g.parents.length).map(g => new GenreWrapper(g));
    // parentGenres = parentGenres.map(g => addChildren(g, genreList));
    // setGenres(songList);
    // const q = query(collection(db, 'genres').withConverter(genreConverter));
    // const snapshot = await getDocs(q);
    // let genreList: Tables<'styles'>[] = []
    // snapshot.forEach((doc) => {
    //   // doc.data() is never undefined for query doc snapshots
    //   genreList.push(doc.data());
    //   if (!!DEV) console.log(doc.id, ' => ', doc.data());
    // });
    // genreList.sort((a, b) => a.name.localeCompare(b.name));
    // let parentGenres: GenreWrapper[] = genreList.filter(g => !g.parents.length).map(g => new GenreWrapper(g));
    // parentGenres = parentGenres.map(g => addChildren(g, genreList));
    // setGenres(parentGenres);
    // if (!!DEV) console.log(parentGenres);
  });

  return (
    <div class="overflow-x-hidden overflow-y-scroll w-screen" style="height: calc(100vh - 128px);">
      <table class="table">
        <tbody>
          <Index each={genres()}>
            {genre => <GenreListItem genre={genre()} padding={0} />}
          </Index>
        </tbody>
      </table>
    </div>
  );
};

export default GenreList;
