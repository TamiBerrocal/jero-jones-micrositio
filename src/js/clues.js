// Clue stickers: three stickers hide a word or phrase each (shown on hover, focus or tap).
// They land in slots that the layout keeps empty, so they never cover content. Slots are grouped by
// section and each load picks three different sections, so two stickers never share one.
const BASE = import.meta.env.BASE_URL;

// Each sticker shows one phrase from its own set, picked at random on every load.
const STICKERS = [
  {
    // Pista 1
    name: 'Bola de disco',
    src: `${BASE}assets/sticker-disco-ball.png`,
    width: 96,
    mobileWidth: 64,
    tips: [
      'Entre la melancolía y la euforia.',
      '¿Qué forma tiene tu onda?',
      '¿Qué forma tiene el descontrol?',
      'Él está entre medio de saltar o bailar.',
    ],
  },
  {
    // Pista 2
    name: 'Rollo fotográfico',
    src: `${BASE}assets/sticker-film-roll.png`,
    width: 70,
    mobileWidth: 46,
    tips: ['Crónicas del futuro.', 'Negativo / Positivo', 'Esta noche damos la vuelta.'],
  },
  {
    // Pista 3
    name: 'Cámara',
    src: `${BASE}assets/sticker-camera.png`,
    width: 120,
    mobileWidth: 78,
    tips: ['¿Qué forma tiene lo que ves?', 'Enfocá el caos.', 'Fuera de foco, dentro de la señal.'],
  },
];

const DESKTOP = window.matchMedia('(min-width: 1024px)');

const random = (max) => Math.floor(Math.random() * max);
const pickOne = (list) => list.splice(random(list.length), 1)[0];

function shuffle(list) {
  const copy = [...list];
  return list.map(() => pickOne(copy));
}

function createClue(sticker, slot, desktop) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'clue';
  const phrase = sticker.tips[random(sticker.tips.length)];
  button.setAttribute('aria-label', `Pista escondida (${sticker.name.toLowerCase()}): ${phrase}`);
  button.setAttribute('aria-expanded', 'false');

  const rotation = random(25) - 12;
  const isHead = slot.classList.contains('clue-slot--head');
  const isFoot = slot.classList.contains('clue-slot--foot');
  const width = desktop ? sticker.width : sticker.mobileWidth;
  const room = Math.max(0, slot.clientWidth - width - 10);
  // On desktop, heading and footer slots are short, so the sticker may rise into the empty
  // padding above them; on phones the heading row can wrap, so the slot grows instead.
  const baseY = isHead && desktop ? -34 : isFoot ? -36 : 0;

  button.style.setProperty('--clue-rot', `${rotation}deg`);
  button.style.setProperty('--clue-w', `${width}px`);
  button.style.setProperty('--clue-x', `${random(room + 1)}px`);
  button.style.setProperty('--clue-y', `${baseY + random(11)}px`);

  const image = document.createElement('img');
  image.src = sticker.src;
  image.alt = '';

  const tip = document.createElement('span');
  tip.className = 'clue__tip cond';
  tip.setAttribute('aria-hidden', 'true');
  tip.textContent = phrase;

  button.append(image, tip);
  return button;
}

// Long phrases are nudged sideways so they stay at least 12px inside the screen edges.
const EDGE = 12;

function placeTip(clue) {
  const tip = clue.querySelector('.clue__tip');
  tip.style.setProperty('--tip-dx', '0px');
  clue.classList.add('is-measuring');
  const { left, right } = tip.getBoundingClientRect();
  clue.classList.remove('is-measuring');
  const viewport = document.documentElement.clientWidth;
  const shift = left < EDGE ? EDGE - left : right > viewport - EDGE ? viewport - EDGE - right : 0;
  tip.style.setProperty('--tip-dx', `${Math.round(shift)}px`);
}

function scatter() {
  const desktop = DESKTOP.matches;
  const media = desktop ? 'desktop' : 'mobile';
  const slots = [...document.querySelectorAll('[data-clue-slot]')];
  slots.forEach((slot) => slot.replaceChildren());

  const groups = new Map();
  slots
    .filter(({ dataset }) => dataset.clueMedia === 'all' || dataset.clueMedia === media)
    .forEach((slot) => {
      const key = slot.dataset.clueGroup;
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    });

  const sections = shuffle([...groups.values()]);
  shuffle(STICKERS).forEach((sticker, index) => {
    const section = sections[index];
    if (!section) return;
    const slot = section[random(section.length)];
    const clue = createClue(sticker, slot, desktop);
    slot.append(clue);
    placeTip(clue);
  });
}

export function initClues() {
  scatter();
  DESKTOP.addEventListener('change', scatter);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => document.querySelectorAll('.clue').forEach(placeTip), 150);
  });

  // Touch screens have no hover: a tap toggles the phrase, tapping elsewhere hides it.
  document.addEventListener('click', (event) => {
    const clicked = event.target.closest('.clue');
    document.querySelectorAll('.clue.is-open').forEach((clue) => {
      if (clue === clicked) return;
      clue.classList.remove('is-open');
      clue.setAttribute('aria-expanded', 'false');
    });
    if (!clicked) return;
    const open = clicked.classList.toggle('is-open');
    clicked.setAttribute('aria-expanded', String(open));
  });
}
