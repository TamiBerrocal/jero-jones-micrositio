import { DEFAULT_FILTERS } from './filters.js';

export { DEFAULT_FILTERS };

export const DEFAULT_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/default-photo.png`;

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
