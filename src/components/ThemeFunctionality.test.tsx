import { render, fireEvent, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeContext, { appTheme, darkThemes, lightThemes } from './ThemeContext'; // useTheme removed as not directly used in test file
import SearchToolbar from './SearchToolbar'; // Changed NavBar to SearchToolbar
import { ParentComponent } from 'solid-js';

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
});

describe('SearchToolbar Theme Toggling', () => { // Renamed describe block
  beforeEach(() => {
    vi.clearAllMocks();
    // Random startup theme is fine for these tests
  });

  it('should toggle between random dark and light themes when SSO text is clicked', async () => { // Renamed test case
    render(() => (
      <TestApp>
        <SearchToolbar /> {/* Changed to SearchToolbar */}
      </TestApp>
    ));

    const ssoElement = screen.getByText('SSO'); // Changed target element

    // --- First toggle ---
    const initialTheme = appTheme();
    const initialThemeIsDark = darkThemes.includes(initialTheme);
    const initialThemeIsLight = lightThemes.includes(initialTheme);
    expect(initialThemeIsDark || initialThemeIsLight).toBe(true);

    await fireEvent.click(ssoElement); // Changed target element
    const themeAfterFirstClick = appTheme();

    expect(themeAfterFirstClick).not.toBe(initialTheme);
    if (initialThemeIsDark) {
      expect(lightThemes).toContain(themeAfterFirstClick);
    } else {
      expect(darkThemes).toContain(themeAfterFirstClick);
    }

    // --- Second toggle ---
    const themeBeforeSecondClick = themeAfterFirstClick;
    const themeBeforeSecondClickIsDark = darkThemes.includes(themeBeforeSecondClick);
    const themeBeforeSecondClickIsLight = lightThemes.includes(themeBeforeSecondClick);

    await fireEvent.click(ssoElement); // Changed target element
    const themeAfterSecondClick = appTheme();

    expect(themeAfterSecondClick).not.toBe(themeBeforeSecondClick);
    if (themeBeforeSecondClickIsDark) {
      expect(lightThemes).toContain(themeAfterSecondClick);
    } else {
      expect(darkThemes).toContain(themeAfterSecondClick);
    }

    // --- Verify it can toggle back to the original category ---
    if (initialThemeIsDark) {
        expect(darkThemes).toContain(themeAfterSecondClick);
    } else {
        expect(lightThemes).toContain(themeAfterSecondClick);
    }
  });

// Removed NavBar specific test for props.start and props.setTab
});
