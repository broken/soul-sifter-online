import { QueryDocumentSnapshot, DocumentData, SnapshotOptions } from "firebase/firestore";
import { createMutable } from "solid-js/store";

class PlaylistEntry {
  id: number;
  position: number;

  constructor(id: number, position: number) {
    this.id = id;
    this.position = position;
    return createMutable(this);
  }

  toString() {
    return `[${this.id}] ${this.position}`;
  }
}

// Firestore data converter
const playlistEntryConverter = {
  toFirestore: (p: PlaylistEntry) => {
    return {
      id: p.id,
      position: p.position
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options?: SnapshotOptions) => {
    const d = snapshot.data(options);
    return new PlaylistEntry(d.id, d.position);
  }
};

const emptyPlaylistEntry = new PlaylistEntry(-1, -1);

export default PlaylistEntry;
export {emptyPlaylistEntry, playlistEntryConverter};
