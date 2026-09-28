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

  function show(style, persist = false) {
    if (!Object.hasOwn(art, style)) return;
    root.dataset.eggStyle = style;
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
