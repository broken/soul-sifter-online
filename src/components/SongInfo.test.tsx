import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignal } from 'solid-js';

import SongInfo from './SongInfo';
import { SongConsumer } from './SongContext';
import { Song, Style } from '../model.types';
import { supabase } from './App';

// Mock SongContext
vi.mock('./SongContext', () => {
  const [song, setSong] = createSignal<Song | undefined>(undefined);
  return {
    SongConsumer: () => ({ song, setSong }),
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
  };

  const sampleStyles: Style[] = [
    { id: 1, name: 'House', description: null, reid: null, relabel: null },
    { id: 2, name: 'French Touch', description: null, reid: null, relabel: null },
    { id: 3, name: 'Techno', description: null, reid: null, relabel: null },
  ];

  let mockDelete: any;
  let mockInsert: any;
  let mockSelect: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockInsert = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'styles') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: sampleStyles, error: null }),
          }),
        };
      }
      if (table === 'songstyles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { styleid: 1, styles: sampleStyles[0] },
                { styleid: 2, styles: sampleStyles[1] },
              ],
              error: null,
            }),
          }),
          insert: mockInsert,
          delete: mockDelete,
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

    // Styles assigned to song
    expect(await screen.findByText('House')).toBeInTheDocument();
    expect(screen.getByText('French Touch')).toBeInTheDocument();

    // In default mode, no remove buttons are shown
    expect(screen.queryByTitle('Remove House')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove French Touch')).not.toBeInTheDocument();
  });

  it('toggles remove mode and reveals remove buttons only when Remove Style is clicked', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong);

    expect(await screen.findByText('House')).toBeInTheDocument();

    const removeStyleBtn = screen.getByRole('button', { name: /remove style/i });
    expect(removeStyleBtn).toBeInTheDocument();

    // Click to enter remove mode
    await fireEvent.click(removeStyleBtn);

    // Now remove buttons appear
    const removeHouseBtn = screen.getByTitle('Remove House');
    expect(removeHouseBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();

    // Clicking remove calls supabase delete
    await fireEvent.click(removeHouseBtn);
    expect(mockDelete).toHaveBeenCalled();

    // Click Done to exit remove mode
    const doneBtn = screen.getByRole('button', { name: /done/i });
    await fireEvent.click(doneBtn);

    // Remove buttons disappear
    expect(screen.queryByTitle('Remove French Touch')).not.toBeInTheDocument();
  });

  it('opens add style menu, searches, and adds a style', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong);

    expect(await screen.findByText('House')).toBeInTheDocument();

    const addStyleBtn = screen.getByRole('button', { name: /\+ add style/i });
    await fireEvent.click(addStyleBtn);

    // Unassigned style 'Techno' should be listed in available styles
    const addTechnoBtn = await screen.findByRole('button', { name: /\+ techno/i });
    expect(addTechnoBtn).toBeInTheDocument();

    // Click to add Techno
    await fireEvent.click(addTechnoBtn);
    expect(mockInsert).toHaveBeenCalledWith({
      songid: 101,
      styleid: 3,
    });
  });
});
