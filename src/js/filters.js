export const FILTERS = [
  { key: 'blur', label: 'Desenfoque', cssFn: 'blur', unit: 'px', min: 0, max: 20 },
  { key: 'brightness', label: 'Brillo', cssFn: 'brightness', unit: '%', min: 0, max: 200 },
  { key: 'contrast', label: 'Contraste', cssFn: 'contrast', unit: '%', min: 0, max: 200 },
  { key: 'grayscale', label: 'Escala de grises', cssFn: 'grayscale', unit: '%', min: 0, max: 100 },
  { key: 'hueRotate', label: 'Tono', cssFn: 'hue-rotate', unit: 'deg', min: 0, max: 360 },
  { key: 'invert', label: 'Invertir', cssFn: 'invert', unit: '%', min: 0, max: 100 },
  { key: 'opacity', label: 'Opacidad', cssFn: 'opacity', unit: '%', min: 0, max: 100 },
  { key: 'saturate', label: 'Saturación', cssFn: 'saturate', unit: '%', min: 0, max: 200 },
  { key: 'sepia', label: 'Sepia', cssFn: 'sepia', unit: '%', min: 0, max: 100 },
];

// blurScale converts the on-screen blur radius to the image's natural resolution.
export function toCssFilter(filters, { blurScale = 1 } = {}) {
  return FILTERS.map(({ key, cssFn, unit }) => {
    const value = key === 'blur' ? filters[key] * blurScale : filters[key];
    return `${cssFn}(${value}${unit})`;
  }).join(' ');
}

export const formatFilterValue = ({ unit }, value) => `${value}${unit === 'deg' ? '°' : unit}`;
