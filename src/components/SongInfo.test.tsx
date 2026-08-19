import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignal } from 'solid-js';
import '@testing-library/jest-dom/vitest';

import SongInfo from './SongInfo';
import { SongConsumer } from './SongContext';
import { Song, Style, StyleChildren } from '../model.types';
import { supabase } from './App';

// Mock SongContext
vi.mock('./SongContext', () => {
  const [song, setSong] = createSignal<Song | undefined>(undefined);
  return {
    SongConsumer: () => ({ song, setSong }),
    default: (props: any) => props.children,
  };
});

// Mock SongsContext
vi.mock('./SongsContext', () => {
  return {
    useSongs: () => ({
      songs: [],
      setSongs: vi.fn(),
    }),
    default: (props: any) => props.children,
  };
});

// Mock Supabase methods
vi.mock('./App', () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('SongInfo Component', () => {
  const mockSong: Song = {
    id: 101,
    artist: 'Daft Punk',
    title: 'One More Time',
    albumid: 1,
    albumpartid: null,
    bpm: 123,
    bpmlock: false,
    comments: null,
    curator: null,
    dateadded: '2023-01-01',
    dupeid: null,
    durationinms: 320000,
    energy: 7,
    featuring: null,
    filepath: '/music/one_more_time.mp3',
    googlesongid: null,
    lowquality: false,
    musicvideoid: null,
    rating: 5,
    remixer: null,
    resongid: null,
    search_text: null,
    spotifyid: null,
    tonickey: '11B',
    tonickeylock: false,
    track: '1',
    trashed: false,
    youtubeid: 'FGBhQbmPwH8',
    youtubemusicid: null,
  };

  const sampleStyles: Style[] = [
    { id: 1, name: 'Electronic', description: null, reid: null, relabel: null },
    { id: 2, name: 'House', description: null, reid: null, relabel: null },
    { id: 3, name: 'French Touch', description: null, reid: null, relabel: null },
    { id: 4, name: 'Techno', description: null, reid: null, relabel: null },
  ];

  // Electronic is parent of House, House is parent of French Touch
  const sampleStyleChildren: StyleChildren[] = [
    { parentid: 1, childid: 2 },
    { parentid: 2, childid: 3 },
  ];

  let mockDelete: any;
  let mockInsertSongStyles: any;
  let mockInsertChanges: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockInsertSongStyles = vi.fn().mockResolvedValue({ error: null });
    mockInsertChanges = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'styles') {
        return {
          select: vi.fn().mockResolvedValue({ data: sampleStyles, error: null }),
        };
      }
      if (table === 'stylechildren') {
        return {
          select: vi.fn().mockResolvedValue({ data: sampleStyleChildren, error: null }),
        };
      }
      if (table === 'songstyles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { styleid: 3, styles: sampleStyles[2] }, // French Touch
              ],
              error: null,
            }),
          }),
          insert: mockInsertSongStyles,
          delete: mockDelete,
        };
      }
      if (table === 'changes') {
        return {
          insert: mockInsertChanges,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
      };
    });

    const { setSong } = SongConsumer();
    setSong(undefined);
  });

  it('renders song details and its assigned styles', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong);

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();
    expect(screen.getByText('One More Time')).toBeInTheDocument();

    // Assigned style
    expect(await screen.findByText('French Touch')).toBeInTheDocument();

    // In default mode, no remove buttons are shown
    expect(screen.queryByTitle('Remove French Touch')).not.toBeInTheDocument();
  });

  it('toggles remove mode and reveals remove buttons only when Remove Style is clicked', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong);

    expect(await screen.findByText('French Touch')).toBeInTheDocument();

    const removeStyleBtn = screen.getByRole('button', { name: /remove style/i });
    expect(removeStyleBtn).toBeInTheDocument();

    // Click to enter remove mode
    await fireEvent.click(removeStyleBtn);

    // Now remove buttons appear
    const removeFrenchTouchBtn = screen.getByTitle('Remove French Touch');
    expect(removeFrenchTouchBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();

    // Clicking remove calls supabase delete on songstyles and insert on changes
    await fireEvent.click(removeFrenchTouchBtn);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockInsertChanges).toHaveBeenCalledWith({
      key: 101,
      table: 'SongStyles',
      field: 'delete',
      value: '3',
    });

    // Click Done to exit remove mode
    const doneBtn = screen.getByRole('button', { name: /done/i });
    await fireEvent.click(doneBtn);

    // Remove buttons disappear
    expect(screen.queryByTitle('Remove French Touch')).not.toBeInTheDocument();
  });

  it('displays styles in a collapsible tree format defaulting to unexpanded and logs addition change', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong);

    const addStyleBtn = screen.getByRole('button', { name: /\+ add style/i });
    await fireEvent.click(addStyleBtn);

    // Top-level parents (Electronic and Techno) should be visible
    expect(await screen.findByText('Electronic')).toBeInTheDocument();
    expect(screen.getByText('Techno')).toBeInTheDocument();

    // Child styles (House and French Touch) should NOT be visible initially because tree defaults to collapsed
    expect(screen.queryByText('House')).not.toBeInTheDocument();

    // Find and click the expand button for Electronic
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    expect(expandButtons.length).toBeGreaterThan(0);
    await fireEvent.click(expandButtons[0]);

    // Now child style 'House' should be visible
    expect(await screen.findByText('House')).toBeInTheDocument();

    // Click + Add button on Techno
    const addTechnoButtons = screen.getAllByRole('button', { name: /\+ add/i });
    await fireEvent.click(addTechnoButtons[0]);

    expect(mockInsertSongStyles).toHaveBeenCalledWith({
      songid: 101,
      styleid: 4,
    });
    expect(mockInsertChanges).toHaveBeenCalledWith({
      key: 101,
      table: 'SongStyles',
      field: 'insert',
      value: '4',
    });
  });
});
