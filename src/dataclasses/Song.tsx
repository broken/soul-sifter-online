import { QueryDocumentSnapshot, DocumentData, SnapshotOptions } from "firebase/firestore";
import { createMutable } from "solid-js/store";

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
    return createMutable(this);
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

const emptySong = new Song(-1, '', '', '', '')

export default Song;
export {emptySong, songConverter};
