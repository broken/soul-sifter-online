import { render, fireEvent, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GenreListItem, { GenreWrapper, genreToEdit, setGenreToEdit } from './GenreListItem';
import { useGenres, GenresContext } from './GenresContext';
import { Style } from '../model.types';

// Mock the GenresContext
vi.mock('./GenresContext', async () => {
  const actual = await vi.importActual('./GenresContext');
  return {
    ...actual,
    useGenres: vi.fn(),
  };
});

const mockSetActiveGenres = vi.fn();
const mockActiveGenres = vi.fn(() => []);

describe('GenreListItem', () => {
  let sampleGenre: Style;
  let wrapperGenre: GenreWrapper;

  beforeEach(() => {
    // Reset mocks and global state before each test
    vi.clearAllMocks();
    setGenreToEdit(undefined);

    (useGenres as vi.Mock).mockReturnValue({
      activeGenres: mockActiveGenres,
      setActiveGenres: mockSetActiveGenres,
    });

    sampleGenre = { id: '1', name: 'Electronic', keywords: [], songIds: [] };
    wrapperGenre = new GenreWrapper(sampleGenre, []);
  });

  it('Test 1: genreToEdit remains undefined when genre name is clicked', async () => {
    render(() => <GenreListItem genre={wrapperGenre} padding={0} />);

    const genreNameElement = screen.getByText(sampleGenre.name);
    await fireEvent.click(genreNameElement);

    expect(genreToEdit()).toBeUndefined();
  });

  it('Test 2: genreToEdit is set when pencil icon is clicked', async () => {
    render(() => <GenreListItem genre={wrapperGenre} padding={0} />);

    // The pencil icon is inside the sibling icons container div
    const genreNameElement = screen.getByText(sampleGenre.name);
    const iconsContainer = genreNameElement.nextElementSibling;
    const pencilIconContainer = iconsContainer?.firstElementChild;

    // Explicitly check if the container is found
    if (!pencilIconContainer) {
      throw new Error('Pencil icon container (nextElementSibling of genre name) not found. Check component structure.');
    }

    await fireEvent.click(pencilIconContainer);

    expect(genreToEdit()).toEqual(sampleGenre);
  });
});
