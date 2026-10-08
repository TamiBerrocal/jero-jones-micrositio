import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { createInitialState, createStore } from './js/store.js';
import { initUploader } from './js/uploader.js';
import { initFilterEditor } from './js/filter-editor.js';
import { initSubmission } from './js/submission.js';

const store = createStore(createInitialState());

initUploader(document.querySelector('#subi'), store);
const editor = initFilterEditor(document.querySelector('#disena'), store);
initSubmission(document.querySelector('#envia'), store, {
  getPreviewWidth: () => editor.previewImage.clientWidth,
});
