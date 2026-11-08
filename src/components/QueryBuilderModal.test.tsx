import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import QueryBuilderModal, { TAG_GROUPS } from './QueryBuilderModal';

describe('QueryBuilderModal Tag-based UI', () => {
  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with tag groups when isOpen is true', () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    expect(screen.getByText('Search Atoms & Query Builder')).toBeInTheDocument();
    expect(screen.getByText('Song Information')).toBeInTheDocument();
    expect(screen.getByText('Music & Attributes')).toBeInTheDocument();
    expect(screen.getByText('Sorting & Status')).toBeInTheDocument();
    expect(screen.getByText('Modifiers & Operators')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
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

    expect(screen.queryByText('Search Atoms & Query Builder')).not.toBeInTheDocument();
  });

  it('inserts tag prefixes when tapped and applies search', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const artistTag = screen.getByRole('button', { name: 'artist:' });
    await fireEvent.click(artistTag);

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;
    expect(input.value).toBe('a:');

    // Type value after prefix
    await fireEvent.input(input, { target: { value: 'a:Daft' } });

    // Tap bpm tag
    const bpmTag = screen.getByRole('button', { name: 'bpm:' });
    await fireEvent.click(bpmTag);

    expect(input.value).toBe('a:Daft bpm:');

    const searchButton = screen.getByRole('button', { name: 'Search' });
    await fireEvent.click(searchButton);

    expect(mockOnApply).toHaveBeenCalledWith('a:Daft bpm:');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('supports quotes and negation modifiers', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const notTag = screen.getByRole('button', { name: '- (NOT)' });
    await fireEvent.click(notTag);

    const artistTag = screen.getByRole('button', { name: 'artist:' });
    await fireEvent.click(artistTag);

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;
    expect(input.value).toBe('-a:');
  });

  it('inserts sorting preset tags', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery=""
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const orderBpmTag = screen.getByRole('button', { name: 'order:bpm' });
    await fireEvent.click(orderBpmTag);

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;
    expect(input.value).toBe('o:bpm');
  });

  it('removes any other order atoms in the search box when an order is selected', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="artist:Justice o:released bpm:120"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;
    expect(input.value).toBe('artist:Justice o:released bpm:120');

    const orderBpmTag = screen.getByRole('button', { name: 'order:bpm' });
    await fireEvent.click(orderBpmTag);

    expect(input.value).toBe('artist:Justice bpm:120 o:bpm');
  });

  it('removes multiple other order atoms and aliases when an order is selected', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="o:rand artist:Justice order:added o:album"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;

    const orderReleasedTag = screen.getByRole('button', { name: 'order:released' });
    await fireEvent.click(orderReleasedTag);

    expect(input.value).toBe('artist:Justice o:released');
  });

  it('preserves non-order terms containing the word order when selecting an order', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery='artist:"New Order" o:released'
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;

    const orderBpmTag = screen.getByRole('button', { name: 'order:bpm' });
    await fireEvent.click(orderBpmTag);

    expect(input.value).toBe('artist:"New Order" o:bpm');
  });

  it('switching orders sequentially replaces the previous order each time', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="artist:Justice"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;

    const orderBpmTag = screen.getByRole('button', { name: 'order:bpm' });
    await fireEvent.click(orderBpmTag);
    expect(input.value).toBe('artist:Justice o:bpm');

    const orderReleasedTag = screen.getByRole('button', { name: 'order:released' });
    await fireEvent.click(orderReleasedTag);
    expect(input.value).toBe('artist:Justice o:released');

    const orderRandTag = screen.getByRole('button', { name: 'order:rand' });
    await fireEvent.click(orderRandTag);
    expect(input.value).toBe('artist:Justice o:rand');
  });

  it('ensures single occurrence for trashed status atoms', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="artist:Justice trashed:1 bpm:120"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;

    const trashedTag = screen.getByRole('button', { name: 'trashed:0' });
    await fireEvent.click(trashedTag);

    expect(input.value).toBe('artist:Justice bpm:120 trashed:0');
  });

  it('ensures single occurrence for mixed status atoms', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="artist:Justice m:0 bpm:120"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;

    const mixed1Tag = screen.getByRole('button', { name: 'mixed:1' });
    await fireEvent.click(mixed1Tag);
    expect(input.value).toBe('artist:Justice bpm:120 m:1');

    const mixed0Tag = screen.getByRole('button', { name: 'mixed:0' });
    await fireEvent.click(mixed0Tag);
    expect(input.value).toBe('artist:Justice bpm:120 m:0');
  });

  it('ensures single occurrence for explicit status atoms', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="artist:Justice explicit:1"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;

    const cleanTag = screen.getByRole('button', { name: 'explicit:0' });
    await fireEvent.click(cleanTag);

    expect(input.value).toBe('artist:Justice el:0');
  });

  it('replaces only the matching atom kind when multiple distinct single-occurrence atoms exist', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="artist:Justice o:bpm trashed:1 m:0"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;

    // Update trashed only
    const trashedTag = screen.getByRole('button', { name: 'trashed:0' });
    await fireEvent.click(trashedTag);
    expect(input.value).toBe('artist:Justice o:bpm m:0 trashed:0');

    // Update order only
    const orderReleasedTag = screen.getByRole('button', { name: 'order:released' });
    await fireEvent.click(orderReleasedTag);
    expect(input.value).toBe('artist:Justice m:0 trashed:0 o:released');

    // Update mixed only
    const mixed1Tag = screen.getByRole('button', { name: 'mixed:1' });
    await fireEvent.click(mixed1Tag);
    expect(input.value).toBe('artist:Justice trashed:0 o:released m:1');
  });

  it('populates initialQuery and clears query on Clear button', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery='artist:"Deadmau5" bpm:128'
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i) as HTMLInputElement;
    expect(input.value).toBe('artist:"Deadmau5" bpm:128');

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await fireEvent.click(clearButton);

    expect(input.value).toBe('');
  });

  it('submits on Enter key in input', async () => {
    render(() => (
      <QueryBuilderModal
        isOpen={true}
        initialQuery="artist:Justice"
        onClose={mockOnClose}
        onApply={mockOnApply}
      />
    ));

    const input = screen.getByPlaceholderText(/Tap tags below to insert atoms/i);
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnApply).toHaveBeenCalledWith('artist:Justice');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
