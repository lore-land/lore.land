// Native disclosures carry the complete experience without JavaScript.
// Enhancement offers a shuffle without repeats and a quiet discovery count.
const cabinet = document.querySelector('.wonder-cabinet');
if (cabinet) {
  const drawers = [...cabinet.querySelectorAll('.wonder-drawer')];
  const button = cabinet.querySelector('.wonder-draw');
  const status = cabinet.querySelector('.wonder-status');
  const discovered = new Set();
  let remaining = [];
  let last;

  function remember(drawer) {
    discovered.add(drawer.id);
    drawer.dataset.discovered = 'true';
    status.textContent = discovered.size === drawers.length
      ? 'Three curiosities, three beginnings. Which thread will you follow?'
      : `${discovered.size} of ${drawers.length} curiosities found. The land has more to tell.`;
  }

  for (const drawer of drawers) {
    drawer.addEventListener('toggle', () => {
      if (drawer.open) remember(drawer);
    });
  }

  button.hidden = false;
  button.addEventListener('click', () => {
    if (!remaining.length) remaining = drawers.filter(drawer => drawer !== last);
    const [chosen] = remaining.splice(Math.floor(Math.random() * remaining.length), 1);
    for (const drawer of drawers) drawer.open = drawer === chosen;
    last = chosen;
    remember(chosen);
    chosen.querySelector('summary').focus({ preventScroll: true });
    chosen.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  });
}
