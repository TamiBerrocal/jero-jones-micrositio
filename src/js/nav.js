// Mobile menu: below the breakpoint the three page links collapse behind a toggle and open as a
// full-screen overlay. Without JS the links simply wrap under the logo.
const MOBILE = window.matchMedia('(max-width: 900px)');

export function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  // The nav is fixed to the top; publish its real height so sticky stages and anchors sit below it.
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--nav-h', `${nav.offsetHeight}px`);
  }).observe(nav);
  const toggle = nav?.querySelector('[data-nav-toggle]');
  const menu = nav?.querySelector('#nav-menu');
  if (!toggle || !menu) return;

  const label = toggle.querySelector('[data-nav-label]');
  nav.classList.add('has-js');
  toggle.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('is-ready')));

  const setOpen = (open, { focus = true } = {}) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    document.documentElement.classList.toggle('menu-open', open);
    if (open && focus) menu.querySelector('a')?.focus();
    else if (!open && focus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false, { focus: false });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
  });
  // Keep Tab inside the open menu: links, then the toggle that closes it.
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !nav.classList.contains('is-open')) return;
    const items = [...menu.querySelectorAll('a'), toggle];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  MOBILE.addEventListener('change', (e) => {
    if (!e.matches && nav.classList.contains('is-open')) setOpen(false, { focus: false });
  });
}
