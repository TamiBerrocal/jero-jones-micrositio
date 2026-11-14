// Every slider starts at 0, which is the untouched image. Brightness, contrast and saturation go
// from -100 to +100 around the original; "Transparencia" is CSS opacity turned around.
export const FILTERS = [
  { key: 'blur', label: 'Desenfoque', unit: 'px', min: 0, max: 20, toCss: (v) => `blur(${v}px)` },
  { key: 'brightness', label: 'Brillo', unit: '', min: -100, max: 100, toCss: (v) => `brightness(${100 + v}%)` },
  { key: 'contrast', label: 'Contraste', unit: '', min: -100, max: 100, toCss: (v) => `contrast(${100 + v}%)` },
  { key: 'grayscale', label: 'Escala de grises', unit: '%', min: 0, max: 100, toCss: (v) => `grayscale(${v}%)` },
  { key: 'hueRotate', label: 'Tono', unit: '°', min: 0, max: 360, toCss: (v) => `hue-rotate(${v}deg)` },
  { key: 'invert', label: 'Invertir', unit: '%', min: 0, max: 100, toCss: (v) => `invert(${v}%)` },
  { key: 'opacity', label: 'Transparencia', unit: '%', min: 0, max: 100, toCss: (v) => `opacity(${100 - v}%)` },
  { key: 'saturate', label: 'Saturación', unit: '', min: -100, max: 100, toCss: (v) => `saturate(${100 + v}%)` },
  { key: 'sepia', label: 'Sepia', unit: '%', min: 0, max: 100, toCss: (v) => `sepia(${v}%)` },
];

export const DEFAULT_FILTERS = Object.freeze(Object.fromEntries(FILTERS.map(({ key }) => [key, 0])));

// blurScale converts the on-screen blur radius to the image's natural resolution.
export function toCssFilter(filters, { blurScale = 1 } = {}) {
  return FILTERS.map(({ key, toCss }) => toCss(key === 'blur' ? filters[key] * blurScale : filters[key])).join(' ');
}

// Signed values for the -100…+100 sliders ("+20"), plain values with their unit for the rest.
export const formatFilterValue = ({ unit, min }, value) => `${min < 0 && value > 0 ? '+' : ''}${value}${unit}`;

// Track fill from the zero point to the thumb, as percentages of the track.
export function fillRange({ min, max }, value) {
  const toPct = (v) => ((v - min) / (max - min)) * 100;
  const zero = toPct(0);
  const at = toPct(value);
  return { from: Math.min(zero, at), to: Math.max(zero, at) };
}
