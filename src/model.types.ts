import { Tables } from './database.types'

type Album = Tables<'albums'>
type AlbumPart = Tables<'albumparts'>
type BasicGenre = Tables<'basicgenres'>
type Change = Tables<'changes'>
type Mix = Tables<'mixes'>
type MusicVideo = Tables<'musicvideos'>
type Playlist = Tables<'playlists'>
type PlaylistEntry = Tables<'playlistentries'>
type PlaylistStyle = Tables<'playliststyles'>
type Song = Tables<'songs'>
type SongStyle = Tables<'songstyles'>
type Style = Tables<'styles'>
type StyleChildren = Tables<'stylechildren'>

export type {
  Album,
  AlbumPart,
  BasicGenre,
  Change,
  Mix,
  MusicVideo,
  Playlist,
  PlaylistEntry,
  PlaylistStyle,
  Song,
  SongStyle,
  Style,
  StyleChildren
}
