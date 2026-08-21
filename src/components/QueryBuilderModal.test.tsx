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
    expect(input.value).toBe('artist:');

    // Type value after prefix
    await fireEvent.input(input, { target: { value: 'artist:Daft' } });

    // Tap bpm tag
    const bpmTag = screen.getByRole('button', { name: 'bpm:' });
    await fireEvent.click(bpmTag);

    expect(input.value).toBe('artist:Daft bpm:');

    const searchButton = screen.getByRole('button', { name: 'Search' });
    await fireEvent.click(searchButton);

    expect(mockOnApply).toHaveBeenCalledWith('artist:Daft bpm:');
    expect(mockOnClose).toHaveBeenCalled();
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
    expect(input.value).toBe('order:bpm');
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
