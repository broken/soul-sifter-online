import { render, fireEvent, screen, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSignal } from 'solid-js';
import '@testing-library/jest-dom/vitest';

import SongInfo from './SongInfo';
import { SongConsumer } from './SongContext';
import { Album, Song, Style, StyleChildren } from '../model.types';
import { supabase } from './App';

const sampleAlbum: Album = {
  id: 1,
  name: 'Discovery',
  artist: 'Daft Punk',
  catalogid: null,
  coverfilepath: null,
  label: 'Virgin',
  mixed: false,
  releasedateday: 12,
  releasedatemonth: 3,
  releasedateyear: 2001,
  basicgenreid: null,
};

const mockSong1: Song = {
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

const mockSong2: Song = {
  ...mockSong1,
  id: 102,
  artist: 'Justice',
  title: 'Genesis',
};

const mockSong3: Song = {
  ...mockSong1,
  id: 103,
  artist: 'Kavinsky',
  title: 'Nightcall',
};

const mockSongsList: Song[] = [mockSong1, mockSong2, mockSong3];

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
      songs: mockSongsList,
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
      if (table === 'albums') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: sampleAlbum, error: null }),
            }),
          }),
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

    setSong(mockSong1);

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();
    expect(screen.getByText('One More Time')).toBeInTheDocument();

    // Assigned style
    expect(await screen.findByText('French Touch')).toBeInTheDocument();

    // In default mode, no remove buttons are shown
    expect(screen.queryByTitle('Remove French Touch')).not.toBeInTheDocument();
  });

  it('toggles edit mode and reveals remove buttons only when Edit is clicked', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong1);

    expect(await screen.findByText('French Touch')).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /edit/i });
    expect(editBtn).toBeInTheDocument();

    // Click to enter edit mode
    await fireEvent.click(editBtn);

    // Now remove buttons appear
    const removeFrenchTouchBtn = await screen.findByTitle('Remove French Touch');
    expect(removeFrenchTouchBtn).toBeInTheDocument();
    const doneBtn = screen.getByRole('button', { name: /done/i });
    expect(doneBtn).toBeInTheDocument();

    // Clicking remove calls supabase delete on songstyles and insert on changes
    await fireEvent.click(removeFrenchTouchBtn);
    expect(mockDelete).toHaveBeenCalled();
    expect(mockInsertChanges).toHaveBeenCalledWith({
      key: 101,
      table: 'SongStyles',
      field: 'delete',
      value: '3',
    });

    // Exit edit mode by clicking button (or button label changes if styles were emptied)
    if (screen.queryByRole('button', { name: /done/i })) {
      await fireEvent.click(screen.getByRole('button', { name: /done/i }));
    }

    // Remove buttons disappear
    expect(screen.queryByTitle('Remove French Touch')).not.toBeInTheDocument();
  });

  it('displays styles in a collapsible tree format defaulting to unexpanded when in edit mode and logs addition change', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong1);

    const editBtn = await screen.findByRole('button', { name: /edit/i });
    await fireEvent.click(editBtn);

    // Top-level parents (Electronic and Techno) should be visible
    await waitFor(() => {
      expect(screen.getByText('Electronic')).toBeInTheDocument();
      expect(screen.getByText('Techno')).toBeInTheDocument();
    });

    // Child styles (House and French Touch) should NOT be visible initially because tree defaults to collapsed
    expect(screen.queryByText('House')).not.toBeInTheDocument();

    // Find and click the expand button for Electronic
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    expect(expandButtons.length).toBeGreaterThan(0);
    await fireEvent.click(expandButtons[0]);

    // Now child style 'House' should be visible
    const houseEl = await screen.findByText('House');
    expect(houseEl).toBeInTheDocument();

    // Click + Add button on Electronic (first '+ Add' button in the tree)
    const addButtons = screen.getAllByRole('button', { name: /\+ add/i });
    await fireEvent.click(addButtons[0]);

    expect(mockInsertSongStyles).toHaveBeenCalledWith({
      songid: 101,
      styleid: 1,
    });
    expect(mockInsertChanges).toHaveBeenCalledWith({
      key: 101,
      table: 'SongStyles',
      field: 'insert',
      value: '1',
    });
  });

  it('navigates to next and previous song using navigation buttons', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong1);

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();

    // Next button should be enabled, previous button disabled on first song
    const nextBtn = screen.getByRole('button', { name: /next song/i });
    const prevBtn = screen.getByRole('button', { name: /previous song/i });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Click Next
    await fireEvent.click(nextBtn);

    // Wait for transition to target song (mockSong2: Justice)
    await waitFor(() => {
      expect(screen.getByText('Justice')).toBeInTheDocument();
      expect(screen.getByText('Genesis')).toBeInTheDocument();
    });

    // Now both prev and next should be enabled
    expect(screen.getByRole('button', { name: /previous song/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /next song/i })).toBeEnabled();

    // Click Previous
    await fireEvent.click(screen.getByRole('button', { name: /previous song/i }));

    await waitFor(() => {
      expect(screen.getByText('Daft Punk')).toBeInTheDocument();
    });
  });

  it('navigates songs using left and right swipe touch gestures', async () => {
    const { setSong } = SongConsumer();
    const { container } = render(() => <SongInfo />);

    setSong(mockSong1);

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();

    const card = container.querySelector('.card')!;
    expect(card).toBeInTheDocument();

    // Swipe Left (deltaX = -100): TouchStart at 200, TouchMove to 100, TouchEnd
    fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(card);

    await waitFor(() => {
      expect(screen.getByText('Justice')).toBeInTheDocument();
    });

    // Swipe Right (deltaX = +100): TouchStart at 100, TouchMove to 200, TouchEnd
    fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(card);

    await waitFor(() => {
      expect(screen.getByText('Daft Punk')).toBeInTheDocument();
    });
  });

  it('navigates songs using arrow keys', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong1);

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();

    // Press ArrowRight to go to next song
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(screen.getByText('Justice')).toBeInTheDocument();
    });

    // Press ArrowLeft to return to previous song
    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    await waitFor(() => {
      expect(screen.getByText('Daft Punk')).toBeInTheDocument();
    });
  });

  it('does not trigger swipe navigation when dragging sliders or interactive controls', async () => {
    const { setSong } = SongConsumer();
    const { container } = render(() => <SongInfo />);

    setSong(mockSong1);

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();

    const slider = container.querySelector('input[type="range"]');
    if (slider) {
      // Touching and dragging on the range slider
      fireEvent.touchStart(slider, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchMove(slider, { touches: [{ clientX: 50, clientY: 100 }] });
      fireEvent.touchEnd(slider);

      // Should still be Daft Punk (did not swipe to Justice)
      expect(screen.getByText('Daft Punk')).toBeInTheDocument();
      expect(screen.queryByText('Justice')).not.toBeInTheDocument();
    }
  });

  it('renders album name and formatted release date fetched from supabase', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong1);

    expect(await screen.findByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('2001-03-12')).toBeInTheDocument();
  });

  it('renders album from attached albums property on song with year only', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong({
      ...mockSong2,
      albums: {
        id: 2,
        name: '† (Cross)',
        artist: 'Justice',
        catalogid: null,
        coverfilepath: null,
        label: 'Ed Banger',
        mixed: false,
        releasedateday: null,
        releasedatemonth: null,
        releasedateyear: 2007,
        basicgenreid: null,
      },
    });

    expect(await screen.findByText('† (Cross)')).toBeInTheDocument();
    expect(screen.getByText('2007')).toBeInTheDocument();
  });

  it('skips songs with trashed=true and no dupeid when clicking next song button', async () => {
    // In mockSongsList: mockSong1 (101), mockSong2 (102), mockSong3 (103)
    // Modify mockSong2 to be trashed with no dupeid
    mockSong2.trashed = true;
    mockSong2.dupeid = null;

    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong1);

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /next song/i });
    expect(nextBtn).toBeEnabled();

    // Clicking Next should skip mockSong2 (Justice) and go to mockSong3 (Kavinsky)
    await fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Kavinsky')).toBeInTheDocument();
      expect(screen.getByText('Nightcall')).toBeInTheDocument();
    });

    // Reset mockSong2
    mockSong2.trashed = false;
  });

  it('renders cover art thumbnail when YouTube ID is present', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong(mockSong1);

    const img = await screen.findByRole('img', { name: /cover art/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://i.ytimg.com/vi/FGBhQbmPwH8/maxresdefault.jpg');
  });

  it('does not render cover art image when YouTube ID is absent', async () => {
    const { setSong } = SongConsumer();
    render(() => <SongInfo />);

    setSong({
      ...mockSong1,
      youtubeid: null,
      youtubemusicid: null,
    });

    expect(await screen.findByText('Daft Punk')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /cover art/i })).not.toBeInTheDocument();
  });
});
