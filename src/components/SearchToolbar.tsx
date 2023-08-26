import { createSignal, type Component } from 'solid-js';

const [searchQuery, setSearchQuery] = createSignal<string>('');
const [searchField, setSearchField] = createSignal<string>('artist');

const SearchToolbar: Component = () => {
  return (
    <div>
      <input type="text" onInput={(e) => setSearchQuery(e.target.value)}></input>
      <button onclick={() => setSearchField(searchField() == 'title' ? 'artist' : 'title')} />
    </div>
  );
};

export default SearchToolbar;
export {searchField, searchQuery};
