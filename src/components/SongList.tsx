import type { Component } from 'solid-js';
import SongListItem from './SongListItem';


const SongList: Component = () => {
  return (
    <div>
      <h1>SongList</h1>
      <SongListItem />
      <SongListItem />
    </div>
  );
};

export default SongList;
