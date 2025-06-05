import { render, fireEvent, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeContext, { appTheme, darkThemes, lightThemes } from './ThemeContext';
import SearchToolbar from './SearchToolbar';
import App from './App'; // Import the main App component
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
  // This self-referential pattern allows chaining
  const supabaseBuilderMock: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], error: null }), // Typically the end of a query chain
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    // Add .single() or .maybeSingle() if used by the application
    // single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    // maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
  };

  return {
    createClient: vi.fn(() => ({
      ...supabaseBuilderMock, // Spread the builder methods for direct use like supabase.from(...)
      auth: {
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        // Add other auth methods if needed
      },
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
    })),
  };
});

// Removed NavBar specific mocks

// A wrapper component to provide ThemeContext for testing
const TestApp: ParentComponent = (props) => {
  return (
    <ThemeContext>
      {props.children}
    </ThemeContext>
  );
};

describe('Theme Initialization', () => {
  it('should select a valid theme on startup', () => {
    const currentTheme = appTheme();
    const allThemes = [...darkThemes, ...lightThemes];
    expect(allThemes).toContain(currentTheme);
  });

  it('should apply the initial random theme to the document on startup', async () => {
    // appTheme() from ThemeContext module gives the initial signal value
    const expectedInitialTheme = appTheme();

    const { unmount } = render(() => <App />);

    // Allow effects to run. A simple promise resolve is often enough for Solid's sync effects.
    await Promise.resolve();

    expect(document.documentElement.getAttribute('data-theme')).toBe(expectedInitialTheme);

    unmount();
  });
});

describe('SearchToolbar Theme Toggling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Random startup theme is fine for these tests
  });

  it('should toggle between random dark and light themes when SSO text is clicked and apply to document', async () => {
    // Render the full App to ensure the global effect in AppView is active
    const { unmount } = render(() => <App />);

    const ssoElement = screen.getByText('SSO');

    // --- First toggle ---
    const initialTheme = appTheme();
    const initialThemeIsDark = darkThemes.includes(initialTheme);
    const initialThemeIsLight = lightThemes.includes(initialTheme);
    expect(initialThemeIsDark || initialThemeIsLight).toBe(true);

    // Check initial document theme (already tested elsewhere, but good for context)
    await Promise.resolve(); // Allow initial effect to run
    expect(document.documentElement.getAttribute('data-theme')).toBe(initialTheme);

    await fireEvent.click(ssoElement);
    const themeAfterFirstClick = appTheme();

    expect(themeAfterFirstClick).not.toBe(initialTheme);
    if (initialThemeIsDark) {
      expect(lightThemes).toContain(themeAfterFirstClick);
    } else {
      expect(darkThemes).toContain(themeAfterFirstClick);
    }
    await Promise.resolve(); // Allow effect to run
    expect(document.documentElement.getAttribute('data-theme')).toBe(themeAfterFirstClick);

    // --- Second toggle ---
    const themeBeforeSecondClick = themeAfterFirstClick; // This is themeAfterFirstClick
    const themeBeforeSecondClickIsDark = darkThemes.includes(themeBeforeSecondClick);
    const themeBeforeSecondClickIsLight = lightThemes.includes(themeBeforeSecondClick);

    await fireEvent.click(ssoElement);
    const themeAfterSecondClick = appTheme();

    expect(themeAfterSecondClick).not.toBe(themeBeforeSecondClick);
    if (themeBeforeSecondClickIsDark) {
      expect(lightThemes).toContain(themeAfterSecondClick);
    } else {
      expect(darkThemes).toContain(themeAfterSecondClick);
    }
    await Promise.resolve(); // Allow effect to run
    expect(document.documentElement.getAttribute('data-theme')).toBe(themeAfterSecondClick);

    // --- Verify it can toggle back to the original category ---
    if (initialThemeIsDark) {
        expect(darkThemes).toContain(themeAfterSecondClick);
    } else {
        expect(lightThemes).toContain(themeAfterSecondClick);
    }
    unmount(); // Cleanup
  });

// Removed NavBar specific test for props.start and props.setTab
});
