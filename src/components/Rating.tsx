import { For, type Component, Show, mergeProps, createSignal, createEffect, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import { ImStarEmpty, ImStarFull } from 'solid-icons/im';
import { Song, songConverter } from "./SongList";
import { db } from "../App";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";

const Rating: Component<{song: Song, mutable: boolean}> = (props) => {
  props = mergeProps({ mutable: false }, props);
  let emptySong = new Song(-1, '', '', '');

  const [getSong, setSong] = createStore<Song>(emptySong);
  createEffect(() => { setSong(props.song); });

  let setRating = (rating: number) => {
    if (!getSong) {
      console.error('Trying to set rating of an undefined song.');
      return;
    }
    setSong('rating', rating);
    setDoc(doc(db, 'songs', getSong.id.toString()).withConverter(songConverter), getSong);
    addDoc(collection(db, 'changes'), {
      id: getSong.id,
      table: 'songs',
      field: 'rating',
      value: getSong.rating,
      timestamp: new Date().getTime()
    });
  };

  return (
    <span class="flex flex-row text-primary items-center">
      <For each={[...Array(5).keys()]}>
        {
          (i) => {
            return (
              <Show when={i < (getSong.rating || 0)} fallback={<ImStarEmpty onclick={() => props.mutable ? setRating(i+1) : ''} />}>
                <ImStarFull onclick={() => props.mutable ? setRating(i+1) : ''} class="fill-secondary"/>
              </Show>
            );
          }
        }
      </For>
    </span>
  );
};

export default Rating;