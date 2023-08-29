import { createSignal, type Component, createEffect, For } from 'solid-js';
import SongListItem from './SongListItem';
import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../App';
import styles from './SongList.module.css';
import { searchField, searchQuery } from './SearchToolbar';

class Song {
  id: number;
  artist: string;
  track: string;
  title: string;
  remixer?: string; // optional property
  rating?: number;
  youtubeId?: string;
  albumName?: string;
  releaseDateYear?: number;
  releaseDateMonth?: number;
  releaseDateDay?: number;

  constructor(id: number, artist: string, track: string, title: string, remixer?: string, rating?: number, youtubeId?: string, albumName?: string, releaseDateYear?: number, releaseDateMonth?: number, releaseDateDay?: number) {
    this.id = id;
    this.artist = artist;
    this.track = track;
    this.title = title;
    this.remixer = remixer;
    this.rating = rating;
    this.youtubeId = youtubeId;
    this.albumName = albumName;
    this.releaseDateYear = releaseDateYear;
    this.releaseDateMonth = releaseDateMonth;
    this.releaseDateDay = releaseDateDay;
  }

  toString() {
    return `[${this.id}] ${this.artist} - ${this.title}`;
  }
}

// Firestore data converter
const songConverter = {
  toFirestore: (s: Song) => {
    return {
      id: s.id,
      artist: s.artist,
      track: s.track,
      title: s.title,
      remixer: s.remixer,
      rating: s.rating,
      youtubeId: s.youtubeId,
      albumName: s.albumName,
      releaseDateYear: s.releaseDateYear,
      releaseDateMonth: s.releaseDateMonth,
      releaseDateDay: s.releaseDateDay
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options?: SnapshotOptions) => {
    const d = snapshot.data(options);
    return new Song(d.id, d.artist, d.track, d.title, d.remixer, d.rating, d.youtubeId, d.albumName, d.releaseDateYear, d.releaseDateMonth, d.releaseDateDay);
  }
};

const [songs, setSongs] = createSignal<Song[]>([]);


const SongList: Component = () => {
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

  let s = new Song(1, 'Dogatech', '1', 'oh hai', undefined, 5, 'none', 'bai', 2023, 8, 23);
  return (
    <div class="overflow-x-hidden overflow-y-scroll">
      <table class="table">
        <SongListItem song={s} />
        <SongListItem song={s} />
        <SongListItem song={s} />
        <For each={songs()}>
          {song => <SongListItem song={song} />}
        </For>
      </table>
    </div>
  );
};

export default SongList;
export {Song, songs};
