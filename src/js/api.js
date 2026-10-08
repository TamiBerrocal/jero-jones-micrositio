const SIMULATED_LATENCY_MS = 1200;

/**
 * Sends a submission (author data + piece file) to the backend.
 * TODO: replace the simulation with a real `fetch(ENDPOINT, { method: 'POST', body: formData })`
 * once the backend is defined.
 */
export async function submitEntry(formData) {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  console.info('[submitEntry] simulated submission', Object.fromEntries(formData));
  return { ok: true };
}
