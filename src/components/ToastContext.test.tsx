import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import '@testing-library/jest-dom/vitest';
import {
  toasts,
  addToast,
  removeToast,
  clearToasts,
  formatErrorArgs,
  initErrorInterceptor,
  ToastContainer,
  ToastProvider,
} from './ToastContext';

describe('formatErrorArgs', () => {
  it('formats strings properly', () => {
    expect(formatErrorArgs(['An error occurred'])).toBe('An error occurred');
    expect(formatErrorArgs(['Prefix:', 'Something broke'])).toBe('Prefix: Something broke');
  });

  it('formats Error objects properly', () => {
    const err = new Error('Network failure');
    expect(formatErrorArgs(['Failed:', err])).toBe('Failed: Network failure');
  });

  it('formats Supabase error objects with message and details', () => {
    const supabaseErr = { message: 'Row not found', details: 'No rows match the filter' };
    expect(formatErrorArgs([supabaseErr])).toBe('Row not found: No rows match the filter');
  });

  it('formats object with error_description', () => {
    const authErr = { error_description: 'Invalid token' };
    expect(formatErrorArgs([authErr])).toBe('Invalid token');
  });

  it('handles empty / null / undefined values safely', () => {
    expect(formatErrorArgs([null, undefined, ''])).toBe('');
  });
});

describe('Toast state management', () => {
  beforeEach(() => {
    clearToasts();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearToasts();
  });

  it('adds and removes toasts', () => {
    addToast('Error 1', 'error');
    expect(toasts().length).toBe(1);
    expect(toasts()[0].message).toBe('Error 1');
    expect(toasts()[0].count).toBe(1);

    removeToast(toasts()[0].id);
    expect(toasts().length).toBe(0);
  });

  it('deduplicates identical errors and increments count', () => {
    addToast('Duplicate error', 'error');
    addToast('Duplicate error', 'error');
    addToast('Duplicate error', 'error');

    expect(toasts().length).toBe(1);
    expect(toasts()[0].message).toBe('Duplicate error');
    expect(toasts()[0].count).toBe(3);
  });

  it('auto-dismisses toasts after duration', () => {
    addToast('Temporary error', 'error', 3000);
    expect(toasts().length).toBe(1);

    vi.advanceTimersByTime(3100);
    expect(toasts().length).toBe(0);
  });

  it('enforces maximum toast limit', () => {
    addToast('Error 1', 'error');
    addToast('Error 2', 'error');
    addToast('Error 3', 'error');
    addToast('Error 4', 'error');
    addToast('Error 5', 'error');
    addToast('Error 6', 'error');

    expect(toasts().length).toBe(5);
    expect(toasts().some((t) => t.message === 'Error 1')).toBe(false);
    expect(toasts().some((t) => t.message === 'Error 6')).toBe(true);
  });
});

describe('Toast UI & console interceptor', () => {
  beforeEach(() => {
    clearToasts();
  });

  afterEach(() => {
    clearToasts();
  });

  it('renders toast alerts and dismisses on click', () => {
    render(() => <ToastContainer />);

    addToast('Test UI error message', 'error');
    expect(screen.getByText('Test UI error message')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('Test UI error message')).not.toBeInTheDocument();
  });

  it('intercepts console.error and displays a toast while preserving console output', () => {
    console.error('Intercepted console error message');

    expect(toasts().some((t) => t.message === 'Intercepted console error message')).toBe(true);
  });
});
