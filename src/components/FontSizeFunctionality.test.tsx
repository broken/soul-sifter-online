import { render, fireEvent, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeContext from './ThemeContext';
import FontSizeContext, { fontSize, setFontSize, fontSizes } from './FontSizeContext';
import Settings from './Settings';
import App from './App';
import { ParentComponent } from 'solid-js';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const supabaseBuilderMock: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
  };

  return {
    createClient: vi.fn(() => ({
      ...supabaseBuilderMock,
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
    })),
  };
});

const TestApp: ParentComponent = (props) => {
  return (
    <ThemeContext>
      <FontSizeContext>
        {props.children}
      </FontSizeContext>
    </ThemeContext>
  );
};

describe('Font Size Initialization', () => {
  it('should initialize with default font size', () => {
    expect(fontSize()).toBe('medium');
    expect(fontSizes.map((f) => f.id)).toContain('medium');
  });

  it('should apply the font size to document.documentElement on app mount', async () => {
    const { unmount } = render(() => <App />);
    await Promise.resolve();

    expect(document.documentElement.style.fontSize).toBe('16px');
    unmount();
  });
});

describe('Settings Font Size Selection', () => {
  beforeEach(() => {
    setFontSize('medium');
  });

  it('should render font size options and update font size on click', async () => {
    const { unmount } = render(() => (
      <TestApp>
        <Settings />
      </TestApp>
    ));

    const largeButton = screen.getByRole('button', { name: /^Large$/i });
    expect(largeButton).toBeTruthy();

    fireEvent.click(largeButton);

    expect(fontSize()).toBe('large');
    expect(largeButton.className).toContain('btn-primary');

    unmount();
  });
});
