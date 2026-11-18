// Submissions go to the Forma de Onda Supabase project (schema in el-disco-mobile-app/supabase/schema.sql).
// Only the anon (public) key may ever be used here: this code ships to the browser.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PUBLIC_BUCKET = 'fan-pieces';
const PRIVATE_BUCKET = 'fan-pieces-private';
const SIMULATED_LATENCY_MS = 1200;

const CONTENT_TYPE_BY_EXTENSION = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' };

const authHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

function describeFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const contentType = file.type || CONTENT_TYPE_BY_EXTENSION[extension];
  if (!CONTENT_TYPE_BY_EXTENSION[extension] || !contentType) {
    throw new Error(`Unsupported piece type: ${file.name}`);
  }
  return { extension, contentType, kind: contentType === 'application/pdf' ? 'pdf' : 'image' };
}

async function ensureOk(response, step) {
  if (response.ok) return;
  const detail = await response.text().catch(() => '');
  const error = new Error(`${step} failed (${response.status}): ${detail}`);
  // Storage reports an oversized object as 413, sometimes wrapped in a 400 with a size message.
  error.tooLarge = response.status === 413 || /too large|maximum allowed size/i.test(detail);
  throw error;
}

async function simulateSubmission(formData) {
  console.warn('[submitEntry] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing: simulating the submission.');
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  console.info('[submitEntry] simulated submission', Object.fromEntries(formData));
  return { ok: true, simulated: true };
}

/**
 * Sends a submission: uploads the piece to Storage, then inserts the author row.
 * Expects the form's FormData plus a `pieza` File. `publico` is present ("on") when the fan
 * agreed to show the piece on the web; otherwise it goes to the private bucket.
 */
export async function submitEntry(formData) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return simulateSubmission(formData);

  const piece = formData.get('pieza');
  const isPublic = formData.get('publico') === 'on';
  const { extension, contentType, kind } = describeFile(piece);
  const filePath = `${crypto.randomUUID()}.${extension}`;
  const bucket = isPublic ? PUBLIC_BUCKET : PRIVATE_BUCKET;

  const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': contentType, 'x-upsert': 'false' },
    body: piece,
  });
  await ensureOk(upload, 'Piece upload');

  const comment = String(formData.get('comentario') ?? '').trim();
  const insert = await fetch(`${SUPABASE_URL}/rest/v1/fan_submissions`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      first_name: String(formData.get('nombre')).trim(),
      last_name: String(formData.get('apellido')).trim(),
      email: String(formData.get('email')).trim(),
      comment: comment || null,
      file_path: filePath,
      file_type: kind,
      is_public: isPublic,
    }),
  });
  await ensureOk(insert, 'Submission insert');

  return { ok: true };
}
