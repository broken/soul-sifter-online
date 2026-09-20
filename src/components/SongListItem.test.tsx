import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import SongListItem from './SongListItem';
import { Song } from '../model.types';

vi.mock('./SongContext', () => ({
  SongConsumer: () => ({
    song: () => undefined,
    setSong: vi.fn(),
  }),
}));

vi.mock('./SongsContext', () => ({
  useSongs: () => ({
    songs: [],
    setSongs: vi.fn(),
  }),
}));

describe('SongListItem', () => {
  const baseSong: Song = {
    id: 1,
    artist: 'Eminem',
    title: 'Lose Yourself',
    albumid: 1,
    albumpartid: null,
    bpm: 86,
    bpmlock: false,
    comments: null,
    curator: null,
    dateadded: '2023-01-01',
    dupeid: null,
    durationinms: 326000,
    energy: 8,
    explicitlyrics: true,
    featuring: null,
    filepath: '/path/lose_yourself.mp3',
    googlesongid: null,
    lowquality: false,
    musicvideoid: null,
    rating: 5,
    remixer: null,
    resongid: null,
    search_text: null,
    spotifyid: null,
    tonickey: '9A',
    tonickeylock: false,
    track: '1',
    trashed: false,
    youtubeid: 'xFYQQPAOz7Y',
    youtubemusicid: null,
  };

  it('renders explicit icon when explicitlylyrics is true', () => {
    const { container } = render(() => (
      <table>
        <tbody>
          <SongListItem song={baseSong} />
        </tbody>
      </table>
    ));

    expect(screen.getByText('Eminem')).toBeInTheDocument();
    expect(screen.getByText('Lose Yourself')).toBeInTheDocument();
    const explicitIcon = container.querySelector('svg[title="Explicit"]');
    expect(explicitIcon).toBeInTheDocument();
  });

  it('does not render explicit icon when explicitlylyrics is false or null', () => {
    const cleanSong: Song = {
      ...baseSong,
      explicitlyrics: false,
    };

    const { container } = render(() => (
      <table>
        <tbody>
          <SongListItem song={cleanSong} />
        </tbody>
      </table>
    ));

    expect(screen.getByText('Lose Yourself')).toBeInTheDocument();
    const explicitIcon = container.querySelector('svg[title="Explicit"]');
    expect(explicitIcon).not.toBeInTheDocument();
  });
});
