import { render, fireEvent, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeContext, { appTheme, darkThemes, lightThemes, useTheme } from './ThemeContext';
import NavBar from './NavBar';
import { ParentComponent } from 'solid-js';

// Mock props for NavBar that are not relevant to theme toggling
const mockStart = vi.fn();
const mockSetTab = vi.fn();

// Implementing the mock for 'start' to execute the callback
mockStart.mockImplementation((fn: () => void) => fn());

// A wrapper component to provide ThemeContext to NavBar for testing
const TestApp: ParentComponent = (props) => {
  return (
    <ThemeContext>
      {props.children}
    </ThemeContext>
  );
};

describe('Theme Initialization', () => {
  it('should select a valid theme on startup', () => {
    // appTheme is initialized globally when ThemeContext.tsx is imported.
    // We just check if the initialized theme is one of the valid themes.
    const currentTheme = appTheme();
    const allThemes = [...darkThemes, ...lightThemes];
    expect(allThemes).toContain(currentTheme);
  });
});

describe('NavBar Theme Toggling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // It's important to reset the theme to a known state before each toggle test,
    // or ensure tests account for the theme carrying over.
    // For simplicity, we'll rely on the random startup, but a more robust
    // test might force a specific theme before each toggle.
  });

  it('should toggle between random dark and light themes when Settings label is clicked', async () => {
    render(() => (
      <TestApp>
        <NavBar start={mockStart} setTab={mockSetTab} />
      </TestApp>
    ));

    const settingsLabel = screen.getByText('Settings'); // Throws error if not found

    // --- First toggle ---
    const initialTheme = appTheme();
    const initialThemeIsDark = darkThemes.includes(initialTheme);
    const initialThemeIsLight = lightThemes.includes(initialTheme);
    expect(initialThemeIsDark || initialThemeIsLight).toBe(true); // Ensure it's a known theme type

    await fireEvent.click(settingsLabel);
    const themeAfterFirstClick = appTheme();

    expect(themeAfterFirstClick).not.toBe(initialTheme);
    if (initialThemeIsDark) {
      expect(lightThemes).toContain(themeAfterFirstClick);
    } else { // initialThemeIsLight
      expect(darkThemes).toContain(themeAfterFirstClick);
    }

    // --- Second toggle ---
    const themeBeforeSecondClick = themeAfterFirstClick;
    const themeBeforeSecondClickIsDark = darkThemes.includes(themeBeforeSecondClick);
    const themeBeforeSecondClickIsLight = lightThemes.includes(themeBeforeSecondClick);

    await fireEvent.click(settingsLabel);
    const themeAfterSecondClick = appTheme();

    expect(themeAfterSecondClick).not.toBe(themeBeforeSecondClick);
    if (themeBeforeSecondClickIsDark) {
      expect(lightThemes).toContain(themeAfterSecondClick);
    } else { // themeBeforeSecondClickIsLight
      expect(darkThemes).toContain(themeAfterSecondClick);
    }

    // --- Verify it can toggle back to the original category ---
    // If initial was dark, after first click it's light, after second click it should be dark again.
    if (initialThemeIsDark) {
        expect(darkThemes).toContain(themeAfterSecondClick);
    } else { // initialThemeIsLight
        expect(lightThemes).toContain(themeAfterSecondClick);
    }
  });

  it('should call props.start and props.setTab when Settings button area (not just label) is clicked', async () => {
    render(() => (
      <TestApp>
        <NavBar start={mockStart} setTab={mockSetTab} />
      </TestApp>
    ));

    // The "Settings" label is inside a button. We test the button itself here.
    // The text "Settings" is a span, its parent is the button we want.
    const settingsButton = screen.getByText('Settings').closest('button');
    // expect(settingsButton).not.toBeNull(); // or check it's truthy if needed, getByText().closest() would throw/return null

    if (settingsButton) { // getByText would throw if label not found, closest might return null
        expect(settingsButton).not.toBeNull(); // Explicitly check button was found
        await fireEvent.click(settingsButton);
        expect(mockStart).toHaveBeenCalled();
        expect(mockSetTab).toHaveBeenCalledWith(3); // Settings is tab index 3
    } else {
        throw new Error("Settings button not found for testing tab switch");
    }
  });
});
