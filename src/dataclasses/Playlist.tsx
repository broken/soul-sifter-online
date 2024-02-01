import { QueryDocumentSnapshot, DocumentData, SnapshotOptions } from "firebase/firestore";
import { createMutable } from "solid-js/store";

class Playlist {
  id: number;
  name: string;
  query?: string;
  youtubeId?: string;

  constructor(id: number, name: string, query?: string, youtubeId?: string) {
    this.id = id;
    this.name = name;
    this.query =  query;
    this.youtubeId = youtubeId;
    return createMutable(this);
  }

  toString() {
    return `[${this.id}] ${this.name}`;
  }
}

// Firestore data converter
const playlistConverter = {
  toFirestore: (p: Playlist) => {
    return {
      id: p.id,
      name: p.name,
      query: p.query,
      youtubeId: p.youtubeId
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options?: SnapshotOptions) => {
    const d = snapshot.data(options);
    return new Playlist(d.id, d.name, d.query, d.youtubeId);
  }
};

const emptyPlaylist = new Playlist(-1, '');

export default Playlist;
export {emptyPlaylist, playlistConverter};
