import { render, fireEvent, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the module itself to spy on its exports
import * as GenreListItemModule from './GenreListItem';
const { default: GenreListItem, GenreWrapper, genreToEdit, setGenreToEdit } = GenreListItemModule;

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

  let setGenreToEditSpy: vi.SpyInstance;

  beforeEach(() => {
    // Reset mocks and global state before each test
    vi.clearAllMocks();

    // Spy on setGenreToEdit
    // Note: We are spying on the module's export.
    // If the component uses a different instance, this spy won't catch it.
    setGenreToEditSpy = vi.spyOn(GenreListItemModule, 'setGenreToEdit');

    // Ensure the signal is reset using the original function before spy overrides it,
    // OR ensure the spy calls the original function if needed for reset.
    // For this case, we want to reset the actual signal state.
    GenreListItemModule.setGenreToEdit(undefined);


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

    // The pencil icon itself is an SVG, let's find its clickable parent span
    // We added 'ml-2 cursor-pointer hover:opacity-70' to this span
    const genreNameElement = screen.getByText(sampleGenre.name);
    const pencilIconContainer = genreNameElement.nextElementSibling;

    // Explicitly check if the container is found
    if (!pencilIconContainer) {
      throw new Error('Pencil icon container (nextElementSibling of genre name) not found. Check component structure.');
    }

    // Optional: Add a more specific attribute to the pencil icon's span in GenreListItem.tsx for robust selection
    // e.g., data-testid="edit-genre-icon"
    // const pencilIconContainer = screen.getByTestId('edit-genre-icon');


    await fireEvent.click(pencilIconContainer);

    expect(setGenreToEditSpy).toHaveBeenCalled();
    expect(setGenreToEditSpy).toHaveBeenCalledWith(sampleGenre);

    // If the spy is called correctly, then the issue is how the test reads the state.
    // The original assertion:
    expect(GenreListItemModule.genreToEdit()).toEqual(sampleGenre);
  });
});
