import { DEFAULT_FILTERS } from './filters.js';

export { DEFAULT_FILTERS };

export const DEFAULT_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/default-photo.webp`;

export const createInitialState = () => ({
  // { file, kind: 'image' | 'pdf', objectUrl } once the user uploads something
  upload: null,
  filters: { ...DEFAULT_FILTERS },
});

export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state));
    },
    // Calls the listener right away so subscribers render the initial state.
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
  };
}

export const isFiltered = (state) =>
  Object.keys(DEFAULT_FILTERS).some((key) => state.filters[key] !== DEFAULT_FILTERS[key]);

export const canSubmit = (state) => Boolean(state.upload) || isFiltered(state);

export const isEditable = (state) => state.upload?.kind !== 'pdf';

export const getImageSource = (state) =>
  state.upload?.kind === 'image' ? state.upload.objectUrl : DEFAULT_IMAGE_SRC;

export function resetStore(store) {
  const { upload } = store.getState();
  if (upload) URL.revokeObjectURL(upload.objectUrl);
  store.setState(createInitialState());
}

// The example photo sits far below the hero but is ~1 MB, so loading it with the page steals bandwidth from
// the hero photo (the LCP on phones). Each image gets it once it is within a screen of the viewport, or ~2 s after
// `load` once the browser is idle, whichever comes first; uploaded files (object URLs) apply right away.
const near = new WeakSet();
const pending = new Map();
function release(image) {
  observer.unobserve(image);
  near.add(image);
  pending.get(image)?.();
  pending.delete(image);
}
const observer = new IntersectionObserver(
  (entries) => entries.forEach(({ target, isIntersecting }) => isIntersecting && release(target)),
  { rootMargin: '100% 0px' },
);
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
const releaseAll = () => setTimeout(() => idle(() => [...pending.keys()].forEach(release)), 2000);
if (document.readyState === 'complete') releaseAll();
else window.addEventListener('load', releaseAll, { once: true });

export function setImageSource(image, src) {
  const apply = () => {
    if (image.getAttribute('src') !== src) image.src = src;
  };
  if (src !== DEFAULT_IMAGE_SRC || near.has(image)) {
    pending.delete(image);
    apply();
    return;
  }
  if (!pending.has(image)) observer.observe(image);
  pending.set(image, apply);
}
