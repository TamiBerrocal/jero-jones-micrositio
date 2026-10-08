import { DEFAULT_FILTERS, getImageSource, isEditable, isFiltered } from './store.js';
import { FILTERS, formatFilterValue, toCssFilter } from './filters.js';

function createFilterControl(config, onChange) {
  const id = `filter-${config.key}`;
  const item = document.createElement('li');
  item.className = 'filter';
  item.innerHTML = `
    <label class="filter__label" for="${id}">${config.label}: <output for="${id}"></output></label>
    <input class="range" id="${id}" type="range" min="${config.min}" max="${config.max}" step="1" />
  `;

  const input = item.querySelector('input');
  const output = item.querySelector('output');
  input.addEventListener('input', () => onChange(config.key, Number(input.value)));

  return { item, input, output };
}

export function initFilterEditor(root, store) {
  const list = root.querySelector('[data-filter-list]');
  const previewImage = root.querySelector('[data-preview-image]');
  const resetButton = root.querySelector('[data-filter-reset]');
  const sourceLabel = root.querySelector('[data-preview-source]');
  const uploadLink = root.querySelector('[data-preview-upload-link]');
  const notice = root.querySelector('[data-preview-notice]');

  const updateFilter = (key, value) => {
    store.setState({ filters: { ...store.getState().filters, [key]: value } });
  };

  const controls = FILTERS.map((config) => {
    const control = createFilterControl(config, updateFilter);
    list.append(control.item);
    return { config, ...control };
  });

  resetButton.addEventListener('click', () => {
    store.setState({ filters: { ...DEFAULT_FILTERS } });
  });

  store.subscribe((state) => {
    const editable = isEditable(state);
    const src = getImageSource(state);
    if (previewImage.getAttribute('src') !== src) previewImage.src = src;
    previewImage.style.filter = editable ? toCssFilter(state.filters) : '';

    controls.forEach(({ config, input, output }) => {
      const value = state.filters[config.key];
      if (Number(input.value) !== value) input.value = value;
      const formatted = formatFilterValue(config, value);
      output.textContent = formatted;
      input.setAttribute('aria-valuetext', formatted);
      input.disabled = !editable;
    });

    resetButton.disabled = !editable || !isFiltered(state);

    const hasOwnImage = state.upload?.kind === 'image';
    sourceLabel.textContent = hasOwnImage ? 'Tu foto' : 'Foto de ejemplo';
    uploadLink.hidden = Boolean(state.upload);
    notice.hidden = editable;
  });

  return { previewImage };
}
