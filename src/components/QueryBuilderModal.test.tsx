import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import QueryBuilderModal, {
  tokenizeQuery,
  formatAtomValue,
  ATOM_DEFINITIONS,
  ORDER_BY_OPTIONS,
} from './QueryBuilderModal';

describe('QueryBuilderModal Helper Functions', () => {
  it('correctly tokenizes queries with and without quotes', () => {
    const query = 'artist:"Daft Punk" bpm:120-130 -trashed:1 electronic';
    const tokens = tokenizeQuery(query);
    expect(tokens).toEqual(['artist:"Daft Punk"', 'bpm:120-130', '-trashed:1', 'electronic']);
  });

  it('correctly formats values with spaces by wrapping them in quotes', () => {
    expect(formatAtomValue('Daft Punk')).toBe('"Daft Punk"');
    expect(formatAtomValue('Discovery')).toBe('Discovery');
    expect(formatAtomValue('"Already Quoted"')).toBe('"Already Quoted"');
  });

  it('contains valid atom definitions and order options', () => {
    expect(ATOM_DEFINITIONS.some((a) => a.key === 'artist')).toBe(true);
    expect(ATOM_DEFINITIONS.some((a) => a.key === 'bpm')).toBe(true);
    expect(ATOM_DEFINITIONS.some((a) => a.key === 'rating')).toBe(true);
    expect(ORDER_BY_OPTIONS.map((o) => o.value)).toContain('bpm');
    expect(ORDER_BY_OPTIONS.map((o) => o.value)).toContain('rand');
    expect(ORDER_BY_OPTIONS.map((o) => o.value)).toContain('released');
    expect(ORDER_BY_OPTIONS.map((o) => o.value)).toContain('added');
    expect(ORDER_BY_OPTIONS.map((o) => o.value)).toContain('album');
  });
});

describe('QueryBuilderModal UI Component', () => {
  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    expect(screen.getByText('Query Builder')).toBeInTheDocument();
    expect(screen.getByText('Constructed Query Preview')).toBeInTheDocument();
    expect(screen.getByText('Apply Search')).toBeInTheDocument();
  });

  it('does not render content when isOpen is false', () => {
    render(() => (
      <QueryBuilderModal
        isOpen={false}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    expect(screen.queryByText('Query Builder')).not.toBeInTheDocument();
  });

  it('builds text atoms and applies query', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const artistInput = screen.getByPlaceholderText('e.g. Daft Punk');
    const titleInput = screen.getByPlaceholderText('e.g. One More Time');

    await fireEvent.input(artistInput, { target: { value: 'Justice' } });
    await fireEvent.input(titleInput, { target: { value: 'Genesis' } });

    const applyButton = screen.getByText('Apply Search');
    await fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('artist:Justice title:Genesis');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('supports quotes for terms with spaces and negation', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const artistInput = screen.getByPlaceholderText('e.g. Daft Punk');
    await fireEvent.input(artistInput, { target: { value: 'Daft Punk' } });

    // Check NOT checkbox for artist
    const notCheckboxes = screen.getAllByRole('checkbox');
    await fireEvent.click(notCheckboxes[0]); // First is Artist NOT

    const applyButton = screen.getByText('Apply Search');
    await fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('-artist:"Daft Punk"');
  });

  it('supports BPM span range and operator', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    // Switch to Musical tab
    const musicTab = screen.getByText('Musical & Attributes');
    await fireEvent.click(musicTab);

    // Click Span Range button
    const spanRangeBtn = screen.getByText('Span Range (e.g. 120-130)');
    await fireEvent.click(spanRangeBtn);

    const minBpmInput = screen.getByPlaceholderText('Min BPM (e.g. 120)');
    const maxBpmInput = screen.getByPlaceholderText('Max BPM (e.g. 130)');

    await fireEvent.input(minBpmInput, { target: { value: '124' } });
    await fireEvent.input(maxBpmInput, { target: { value: '128' } });

    const applyButton = screen.getByText('Apply Search');
    await fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('bpm:124-128');
  });

  it('populates fields from existing initialQuery', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery='artist:"Deadmau5" bpm:128 rating:>=4 -trashed:1'
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const artistInput = screen.getByPlaceholderText('e.g. Daft Punk') as HTMLInputElement;
    await waitFor(() => {
      expect(artistInput.value).toBe('Deadmau5');
    });

    const applyButton = screen.getByText('Apply Search');
    await fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('artist:Deadmau5 bpm:128 rating:>=4 -trashed:1');
  });

  it('resets all fields when Reset All is clicked', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery='artist:Kavinsky'
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const resetBtn = screen.getByText('Reset All');
    await fireEvent.click(resetBtn);

    const applyButton = screen.getByText('Apply Search');
    await fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('');
  });
});

