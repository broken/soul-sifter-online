import { createContext, createSignal, For, onMount, ParentComponent, Show, useContext } from 'solid-js';

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  count: number;
  timerId?: ReturnType<typeof setTimeout>;
}

interface ToastContextType {
  toasts: () => ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);

let nextId = 1;

export function removeToast(id: string) {
  setToasts((prev) => {
    const item = prev.find((t) => t.id === id);
    if (item?.timerId) clearTimeout(item.timerId);
    return prev.filter((t) => t.id !== id);
  });
}

export function clearToasts() {
  setToasts((prev) => {
    prev.forEach((t) => {
      if (t.timerId) clearTimeout(t.timerId);
    });
    return [];
  });
}

export function addToast(message: string, type: ToastType = 'error', duration = 6000) {
  const trimmed = message?.trim();
  if (!trimmed) return;

  setToasts((prev) => {
    // Check if identical toast exists
    const existingIndex = prev.findIndex((t) => t.message === trimmed && t.type === type);
    if (existingIndex !== -1) {
      const existing = prev[existingIndex];
      if (existing.timerId) clearTimeout(existing.timerId);

      const newTimerId = duration > 0 ? setTimeout(() => {
        removeToast(existing.id);
      }, duration) : undefined;

      const updated = [...prev];
      updated[existingIndex] = {
        ...existing,
        count: existing.count + 1,
        timerId: newTimerId,
      };
      return updated;
    }

    const id = `toast-${nextId++}-${Date.now()}`;
    const timerId = duration > 0 ? setTimeout(() => {
      removeToast(id);
    }, duration) : undefined;

    const newToast: ToastItem = {
      id,
      type,
      message: trimmed,
      count: 1,
      timerId,
    };

    const maxToasts = 5;
    const nextList = [...prev, newToast];
    if (nextList.length > maxToasts) {
      const removed = nextList.shift();
      if (removed?.timerId) clearTimeout(removed.timerId);
    }
    return nextList;
  });
}

export function formatErrorArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg === null || arg === undefined) return '';
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message || arg.name || String(arg);
      if (typeof arg === 'object') {
        const obj = arg as Record<string, any>;
        if (typeof obj.message === 'string' && obj.message) {
          if (typeof obj.details === 'string' && obj.details) {
            return `${obj.message}: ${obj.details}`;
          }
          return obj.message;
        }
        if (typeof obj.details === 'string' && obj.details) return obj.details;
        if (typeof obj.error_description === 'string' && obj.error_description) return obj.error_description;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .filter(Boolean)
    .join(' ');
}

let isInterceptorInstalled = false;
let isHandlingError = false;

export function initErrorInterceptor() {
  if (isInterceptorInstalled || typeof window === 'undefined') return;
  isInterceptorInstalled = true;

  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    try {
      originalConsoleError.apply(console, args);
    } catch {
      // ignore
    }

    if (!isHandlingError) {
      isHandlingError = true;
      try {
        const msg = formatErrorArgs(args);
        if (msg) {
          addToast(msg, 'error');
        }
      } catch {
        // safeguard against any formatting issues
      } finally {
        isHandlingError = false;
      }
    }
  };

  window.addEventListener('error', (event) => {
    if (event.error) {
      const msg = formatErrorArgs([event.error]);
      if (msg) addToast(msg, 'error');
    } else if (event.message) {
      addToast(event.message, 'error');
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason) {
      const msg = formatErrorArgs([event.reason]);
      if (msg) addToast(msg, 'error');
    }
  });
}

export const ToastContainer: ParentComponent = () => {
  return (
    <div
      class="toast toast-top toast-center sm:toast-end p-4 z-[9999] pointer-events-none max-w-full sm:max-w-md w-full flex flex-col gap-2"
      style={{ "max-height": "80vh", "overflow-y": "auto" }}
    >
      <For each={toasts()}>
        {(toast) => (
          <div
            role="alert"
            class="alert shadow-lg flex items-start justify-between text-sm py-2.5 px-3.5 break-words pointer-events-auto rounded-lg transition-all duration-200 border"
            classList={{
              'alert-error border-error/30 text-error-content': toast.type === 'error',
              'alert-warning border-warning/30 text-warning-content': toast.type === 'warning',
              'alert-info border-info/30 text-info-content': toast.type === 'info',
              'alert-success border-success/30 text-success-content': toast.type === 'success',
            }}
          >
            <div class="flex items-start gap-2 flex-1 min-w-0">
              <Show when={toast.type === 'error'}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="stroke-current shrink-0 h-5 w-5 mt-0.5 text-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Show>
              <Show when={toast.type === 'warning'}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="stroke-current shrink-0 h-5 w-5 mt-0.5 text-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </Show>
              <Show when={toast.type === 'info' || toast.type === 'success'}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="stroke-current shrink-0 h-5 w-5 mt-0.5 text-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Show>
              <div class="flex-1 min-w-0">
                <span class="break-words font-medium">{toast.message}</span>
                <Show when={toast.count > 1}>
                  <span class="badge badge-neutral badge-sm ml-2 font-mono align-middle">
                    x{toast.count}
                  </span>
                </Show>
              </div>
            </div>
            <button
              aria-label="Dismiss"
              class="btn btn-ghost btn-xs btn-circle shrink-0 hover:bg-black/20 text-current ml-2"
              onClick={() => removeToast(toast.id)}
            >
              ✕
            </button>
          </div>
        )}
      </For>
    </div>
  );
};

const ToastContext = createContext<ToastContextType>({
  toasts,
  addToast,
  removeToast,
  clearToasts,
});

export const ToastProvider: ParentComponent = (props) => {
  onMount(() => {
    initErrorInterceptor();
  });

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {props.children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export { toasts };

// Automatically activate interceptor upon module load
initErrorInterceptor();
