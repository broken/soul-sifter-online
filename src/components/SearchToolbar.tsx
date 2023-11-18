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
      <button class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onclick={() => setSearchField(searchField() == 'title' ? 'artist' : 'title')}>{searchField()}</button>
    </div>
  );
};

export default SearchToolbar;
export {searchField, searchQuery};
