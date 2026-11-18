import { canSubmit, getImageSource, isFiltered, resetStore, setImageSource } from './store.js';
import { toCssFilter } from './filters.js';
import { submitEntry } from './api.js';
import { MAX_BYTES } from './uploader.js';

// Filtered photos are re-encoded as JPEG: a full-size lossless PNG of a phone photo easily passes the
// 10 MB bucket limit. Start near-lossless, then trade quality and size until the piece fits.
const MAX_EDGE = 4000;
const JPEG_QUALITIES = [0.92, 0.85, 0.75, 0.65];
const SHRINK_STEP = 0.8;

const ERROR_MESSAGES = {
  valueMissing: 'Completá este campo.',
  typeMismatch: 'Revisá el mail, por ejemplo: nombre@mail.com',
  patternMismatch: 'Revisá el mail, por ejemplo: nombre@mail.com',
};

function describeSummary(state) {
  const { upload } = state;
  if (upload?.kind === 'pdf') return `Vas a enviar tu PDF: ${upload.file.name}`;
  if (upload && isFiltered(state)) return 'Vas a enviar tu foto, con tus filtros.';
  if (upload) return `Vas a enviar tu archivo: ${upload.file.name}`;
  if (isFiltered(state)) return 'Vas a enviar la foto de ejemplo, con tus filtros.';
  return 'Todavía no hay nada para enviar.';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

// Sends the original file when nothing was edited; otherwise renders the filtered image.
async function buildPiece(state, previewWidth) {
  const { upload } = state;
  if (upload && (upload.kind === 'pdf' || !isFiltered(state))) return upload.file;

  const image = await loadImage(getImageSource(state));
  let scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));

  for (;;) {
    const canvas = renderFiltered(image, state.filters, previewWidth, scale);
    for (const quality of JPEG_QUALITIES) {
      const blob = await toJpeg(canvas, quality);
      if (blob.size <= MAX_BYTES) return new File([blob], 'pieza.jpg', { type: 'image/jpeg' });
    }
    scale *= SHRINK_STEP;
  }
}

function renderFiltered(image, filters, previewWidth, scale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);

  const context = canvas.getContext('2d');
  // Blur radii are tuned on the on-screen preview, so scale them to the exported width.
  const blurScale = previewWidth ? canvas.width / previewWidth : 1;
  context.filter = toCssFilter(filters, { blurScale });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function toJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Empty canvas'))), 'image/jpeg', quality);
  });
}

export function initSubmission(root, store, { getPreviewWidth }) {
  const wrapper = root.querySelector('[data-submit-form-wrapper]');
  const form = root.querySelector('[data-submit-form]');
  const fieldset = root.querySelector('[data-submit-fieldset]');
  const lockHint = root.querySelector('[data-lock-hint]');
  const summaryImage = root.querySelector('[data-summary-image]');
  const summaryPdf = root.querySelector('[data-summary-pdf]');
  const summaryCaption = root.querySelector('[data-summary-caption]');
  const submitButton = root.querySelector('[data-submit-button]');
  const submitLabel = root.querySelector('[data-submit-label]');
  const submitStatus = root.querySelector('[data-submit-status]');
  const commentCount = root.querySelector('[data-comment-count]');
  const success = root.querySelector('[data-submit-success]');
  const successTitle = root.querySelector('[data-success-title]');
  const successText = root.querySelector('[data-success-text]');
  const againButton = root.querySelector('[data-submit-again]');

  const requiredFields = [...form.querySelectorAll('[required]')];
  const comment = form.elements.comentario;
  let isSubmitting = false;

  function validateField(field) {
    const error = root.querySelector(`#${field.id}-error`);
    const failing = Object.keys(ERROR_MESSAGES).find((key) => field.validity[key]);
    field.setAttribute('aria-invalid', String(Boolean(failing)));
    error.hidden = !failing;
    error.textContent = failing ? ERROR_MESSAGES[failing] : '';
    return !failing;
  }

  requiredFields.forEach((field) => {
    field.addEventListener('blur', () => field.value && validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  comment.addEventListener('input', () => {
    commentCount.textContent = `${comment.value.length} / ${comment.maxLength}`;
  });

  function render(state) {
    const enabled = canSubmit(state);
    fieldset.disabled = !enabled || isSubmitting;
    lockHint.hidden = enabled;
    form.classList.toggle('is-locked', !enabled);

    const isPdf = state.upload?.kind === 'pdf';
    summaryPdf.toggleAttribute('hidden', !isPdf);
    summaryImage.hidden = isPdf;
    if (!isPdf) {
      setImageSource(summaryImage, getImageSource(state));
      summaryImage.style.filter = toCssFilter(state.filters);
    }
    summaryCaption.textContent = describeSummary(state);
  }

  function setSubmitting(value) {
    isSubmitting = value;
    submitButton.classList.toggle('is-loading', value);
    submitLabel.textContent = value ? 'Enviando…' : 'Enviar mi pieza';
    render(store.getState());
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting || !canSubmit(store.getState())) return;

    const results = requiredFields.map(validateField);
    if (results.includes(false)) {
      requiredFields[results.indexOf(false)].focus();
      return;
    }

    // Read the fields before disabling the fieldset: disabled controls are left out of FormData.
    const formData = new FormData(form);
    submitStatus.hidden = true;
    setSubmitting(true);
    try {
      formData.append('pieza', await buildPiece(store.getState(), getPreviewWidth()));
      await submitEntry(formData);

      const firstName = form.elements.nombre.value.trim();
      const email = form.elements.email.value.trim();
      successTitle.textContent = `¡Gracias, ${firstName}!`;
      successText.textContent = `Recibimos tu pieza. Si queda seleccionada, te escribimos a ${email}.`;
      wrapper.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (error) {
      console.error(error);
      submitStatus.textContent = error.tooLarge
        ? 'Tu archivo pesa demasiado. Probá con uno más liviano.'
        : 'No pudimos enviar tu pieza. Revisá tu conexión y probá de nuevo.';
      submitStatus.hidden = false;
    } finally {
      setSubmitting(false);
    }
  });

  againButton.addEventListener('click', () => {
    form.reset();
    commentCount.textContent = `0 / ${comment.maxLength}`;
    requiredFields.forEach((field) => field.removeAttribute('aria-invalid'));
    resetStore(store);
    success.hidden = true;
    wrapper.hidden = false;
    document.querySelector('#subi').scrollIntoView();
  });

  store.subscribe(render);
}
