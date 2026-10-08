import { DEFAULT_FILTERS } from './store.js';

const MAX_BYTES = 10 * 1024 * 1024;

const KIND_BY_MIME = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'application/pdf': 'pdf',
};

// Some systems report an empty MIME type, so fall back to the extension.
const KIND_BY_EXTENSION = { jpg: 'image', jpeg: 'image', png: 'image', pdf: 'pdf' };

function resolveKind(file) {
  if (KIND_BY_MIME[file.type]) return KIND_BY_MIME[file.type];
  const extension = file.name.split('.').pop()?.toLowerCase();
  return file.type ? null : KIND_BY_EXTENSION[extension] ?? null;
}

function formatBytes(bytes) {
  const format = (value) => value.toLocaleString('es-AR', { maximumFractionDigits: 1 });
  if (bytes < 1024 * 1024) return `${format(bytes / 1024)} KB`;
  return `${format(bytes / (1024 * 1024))} MB`;
}

function formatLabel(file) {
  const extension = file.name.split('.').pop()?.toUpperCase() ?? '';
  return `${extension} · ${formatBytes(file.size)}`;
}

const hasFiles = (event) => event.dataTransfer?.types.includes('Files');

export function initUploader(root, store) {
  const input = root.querySelector('[data-upload-input]');
  const dropzone = root.querySelector('[data-dropzone]');
  const card = root.querySelector('[data-file-card]');
  const thumb = root.querySelector('[data-file-thumb]');
  const pdfIcon = root.querySelector('[data-file-pdf]');
  const name = root.querySelector('[data-file-name]');
  const meta = root.querySelector('[data-file-meta]');
  const note = root.querySelector('[data-file-note]');
  const replaceButton = root.querySelector('[data-file-replace]');
  const removeButton = root.querySelector('[data-file-remove]');
  const status = root.querySelector('[data-upload-status]');

  function showStatus(message, { isError = false } = {}) {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  }

  function handleFile(file) {
    const kind = resolveKind(file);
    if (!kind) {
      showStatus('Ese formato no se puede subir. Usá un JPG, PNG o PDF.', { isError: true });
      return;
    }
    if (file.size > MAX_BYTES) {
      showStatus('El archivo pesa más de 10 MB. Probá con uno más liviano.', { isError: true });
      return;
    }

    const previous = store.getState().upload;
    if (previous) URL.revokeObjectURL(previous.objectUrl);

    store.setState({
      upload: { file, kind, objectUrl: URL.createObjectURL(file) },
      filters: { ...DEFAULT_FILTERS },
    });
    showStatus(`Subiste ${file.name}.`);
    replaceButton.focus();
  }

  function removeFile() {
    const { upload } = store.getState();
    if (upload) URL.revokeObjectURL(upload.objectUrl);
    store.setState({ upload: null, filters: { ...DEFAULT_FILTERS } });
    showStatus('Quitaste el archivo.');
    dropzone.focus();
  }

  dropzone.addEventListener('click', () => input.click());
  replaceButton.addEventListener('click', () => input.click());
  removeButton.addEventListener('click', removeFile);

  input.addEventListener('change', () => {
    const [file] = input.files;
    if (file) handleFile(file);
    input.value = '';
  });

  dropzone.addEventListener('dragover', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dropzone.classList.add('is-dragging');
  });

  dropzone.addEventListener('dragleave', (event) => {
    if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('is-dragging');
  });

  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragging');
    const [file] = event.dataTransfer.files;
    if (file) handleFile(file);
  });

  // Keep the browser from navigating away when a file misses the dropzone.
  window.addEventListener('dragover', (event) => hasFiles(event) && event.preventDefault());
  window.addEventListener('drop', (event) => hasFiles(event) && event.preventDefault());

  store.subscribe(({ upload }) => {
    dropzone.hidden = Boolean(upload);
    card.hidden = !upload;
    if (!upload) {
      thumb.removeAttribute('src');
      return;
    }

    const isImage = upload.kind === 'image';
    thumb.hidden = !isImage;
    pdfIcon.toggleAttribute('hidden', isImage);
    if (isImage && thumb.getAttribute('src') !== upload.objectUrl) thumb.src = upload.objectUrl;

    name.textContent = upload.file.name;
    meta.textContent = formatLabel(upload.file);
    note.innerHTML = isImage
      ? '<a href="#disena">Tu imagen ya está en el editor ↓</a>'
      : 'Los PDF se envían tal cual, sin filtros.';
  });
}
