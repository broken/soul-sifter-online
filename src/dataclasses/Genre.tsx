import { QueryDocumentSnapshot, DocumentData, SnapshotOptions } from "firebase/firestore";
import { createMutable } from "solid-js/store";

class Genre {
  id: number;
  name: string;
  parents: number[];

  constructor(id: number, name: string, parents: number[]) {
    this.id = id;
    this.name = name;
    this.parents = parents;
    return createMutable(this);
  }

  toString() {
    return `[${this.id}] ${this.name}`;
  }
}

// Firestore data converter
const genreConverter = {
  toFirestore: (g: Genre) => {
    return {
      id: g.id,
      name: g.name,
      parents: g.parents
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>, options?: SnapshotOptions) => {
    const d = snapshot.data(options);
    return new Genre(d.id, d.name, d.parents);
  }
};

const emptyGenre = new Genre(-1, '', [])

export default Genre;
export {emptyGenre, genreConverter};
