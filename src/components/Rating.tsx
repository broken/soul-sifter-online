import { For, type Component, Show, mergeProps } from "solid-js";
import { produce } from "solid-js/store";
import { ImStarEmpty, ImStarFull } from 'solid-icons/im';
import { db } from "../App";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { SongsConsumer } from "./SongsContext";
import Song, { songConverter } from "../dataclasses/Song";
import { SongConsumer } from "./SongContext";

const Rating: Component<{song: Song | undefined, mutable: boolean}> = (props) => {
  props = mergeProps({ mutable: false }, props);
  const {setSongs} = SongsConsumer();
  const {setSong} = SongConsumer();

  let setRating = (rating: number) => {
    if (!props.song) {
      console.error('Trying to set rating of an undefined song.');
      return;
    }
    props.song.rating = rating;
    setSong(props.song);
    setSongs(
        (s: Song) => s.id === props.song?.id,
        produce((s: Song) => s.rating = rating)
    );
    setDoc(doc(db, 'songs', props.song.id.toString()).withConverter(songConverter), props.song, { merge: true });
    addDoc(collection(db, 'changes'), {
      id: props.song.id,
      table: 'songs',
      field: 'rating',
      value: props.song.rating,
      timestamp: new Date().getTime()
    });
  };

  return (
    <span class="flex flex-row text-primary items-center">
      <For each={[...Array(5).keys()]}>
        {
          (i) => {
            return (
              <Show when={i < (props.song?.rating || 0)} fallback={<ImStarEmpty onclick={() => props.mutable ? setRating(i+1) : ''} />}>
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