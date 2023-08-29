import { createSignal, type Component } from 'solid-js';

const [searchQuery, setSearchQuery] = createSignal<string>('');
const [searchField, setSearchField] = createSignal<string>('artist');

const SearchToolbar: Component = () => {
  const [inputFocused, setInputFocused] = createSignal<boolean>(false);
  return (
    <div style="width:100%">
      <input type="text"
          onInput={(e) => setSearchQuery(e.target.value)}
          class="input input-bordered flex-1"
          classList={{["input-primary"]:inputFocused()}}
          onfocusin={() => setInputFocused(true)} onfocusout={() => setInputFocused(false)}></input>
      <button onclick={() => setSearchField(searchField() == 'title' ? 'artist' : 'title')} />
    </div>
  );
};

export default SearchToolbar;
export {searchField, searchQuery};
