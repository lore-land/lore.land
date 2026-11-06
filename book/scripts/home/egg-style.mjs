// A reader's visual interpretation of the same unresolved egg. The chosen
// shell follows them into chapter motif marks; prose and canon stay fixed.
const picker = document.querySelector('.egg-style-picker');
if (picker) {
  const root = document.documentElement;
  const preview = document.querySelector('[data-egg-preview]');
  const art = {
    opal: '/book/images/home/egg-opal-smooth-v2.webp',
    stone: '/book/images/home/egg-stone-smooth-v2.webp',
    amber: '/book/images/home/egg-amber-smooth-v1.webp'
  };
  // Every change says what it changed: the hint names the reading just chosen.
  // (Wording from .spw/surfaces/dragon-egg.spw#appearance_lenses.)
  const readings = {
    opal: 'Opal: a translucent teal shell; the warmth pools low inside and shows nothing of what it holds.',
    stone: 'Stone: a satin blue-grey shell with a teal sheen; amber warmth comes through its lower half.',
    amber: 'Amber: a honey shell with sea-green light at the crown and gold held low inside.'
  };
  const hint = document.getElementById('egg-style-hint');
  const figure = document.querySelector('.hub-hero-media');

  function show(style, persist = false) {
    if (!Object.hasOwn(art, style)) return;
    root.dataset.eggStyle = style;
    if (persist) {
      if (hint) hint.textContent = `${readings[style]} Same egg.`;
      figure?.classList.remove('is-turning');
      void figure?.offsetWidth;
      figure?.classList.add('is-turning');
    }
    const radio = picker.querySelector(`input[value="${style}"]`);
    if (radio) radio.checked = true;
    if (preview) preview.src = art[style];
    if (persist) {
      try { localStorage.setItem('lore-egg-style-v1', style); }
      catch { /* The choice still works for this visit. */ }
    }
  }

  show(root.dataset.eggStyle || 'opal');
  picker.hidden = false;
  picker.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === 'egg-style') {
      show(event.target.value, true);
    }
  });
}
