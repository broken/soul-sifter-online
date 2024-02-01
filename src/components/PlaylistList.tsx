import { type Component, createEffect, Index, DEV } from 'solid-js';
import SongListItem from './SongListItem';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../App';
import styles from './SongList.module.css';
import { searchField, searchQuery } from './SearchToolbar';
import { SongsConsumer } from './SongsContext';
import Song, { songConverter } from '../dataclasses/Song';


const PlaylistList: Component = () => {


  return (
    <div class="overflow-x-hidden overflow-y-scroll">
      <table class="table">
        <tbody>
        PlaylistList
        </tbody>
      </table>
    </div>
  );
};

export default PlaylistList;
