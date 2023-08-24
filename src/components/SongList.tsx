import type { Component } from 'solid-js';
import SongListItem from './SongListItem';

class Song {
  id: number;
  artist: string;
  track: string;
  title: string;
  remixer?: string; // optional property
  rating: number;
  youtubeId: string;
  albumName: string;
  releaseDateYear: number;
  releaseDateMonth: number;
  releaseDateDay: number;

  constructor(id: number, artist: string, track: string, title: string, remixer?: string, rating: number, youtubeId: string, albumName: string, releaseDateYear: number, releaseDateMonth: number, releaseDateDay: number) {
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


const SongList: Component = () => {
  let s = new Song(1, 'Dogatech', '1', 'oh hai', undefined, 5, 'none', 'bai', 2023, 8, 23);
  return (
    <div>
      <h1>SongList</h1>
      <SongListItem song={s} />
      <SongListItem song={s} />
    </div>
  );
};

export default SongList;
