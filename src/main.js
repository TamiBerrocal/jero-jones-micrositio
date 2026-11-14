import './styles/tokens.css';
import './styles/base.css';
import './styles/shared.css';
import './styles/layout.css';
import './styles/components.css';

import { initNav } from './js/nav.js';
import { initClues } from './js/clues.js';
import { createInitialState, createStore } from './js/store.js';
import { initUploader } from './js/uploader.js';
import { initFilterEditor } from './js/filter-editor.js';
import { initSubmission } from './js/submission.js';

initNav();
initClues();

const store = createStore(createInitialState());

initUploader(document.querySelector('#subi'), store);
const editor = initFilterEditor(document.querySelector('#disena'), store);
initSubmission(document.querySelector('#envia'), store, {
  getPreviewWidth: () => editor.previewImage.clientWidth,
});
