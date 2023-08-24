import type { Component } from 'solid-js';
import { setSearchQuery } from './SongList';

const SearchToolbar: Component = () => {
  return (
    <div>
      <input type="text" onInput={(e) => setSearchQuery(e.target.value)}></input>
    </div>
  );
};

export default SearchToolbar;
