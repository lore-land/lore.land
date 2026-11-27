/**
 * chapter/routes.mjs — Chapter prev/next routing, Spw hypertext route list,
 * primary chapter carry-on button, and Alt-key navigation shortcuts.
 */
import { deriveChapterLinks } from '../modules/chapter-links.mjs?v=2026_11_10.A';
import { normalizeSpwSource, withSiteBase } from '../modules/spw-routing.mjs?v=2026_03_02.A';

export function bindRouteControl(control, route, announce) {
  if (!control || !route) {
    return;
  }

  control.setAttribute('data-spw-route', route.routeName);
  control.setAttribute('data-spw-route-label', route.label);
  control.setAttribute('data-spw-expression', 'true');

  // Real links (the template ships them) navigate natively: new tabs,
  // prefetch, and cross-document view transitions all keep working.
  if (control.tagName === 'A' && control.getAttribute('href')) {
    return;
  }

  control.textContent = route.label;
  control.setAttribute('aria-label', route.ariaLabel);
  control.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = route.href;
    if (announce) {
      announce(`Route activated: ${route.label}`);
    }
  });
}

export function setupKeyboardRoutes(links, announce) {
  if (document.body.dataset.spwShortcuts === 'ready') {
    return null;
  }

  document.body.dataset.spwShortcuts = 'ready';

  const onKeydown = (event) => {
    if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) {
      return;
    }

    const focused = document.activeElement;
    const tagName = focused ? focused.tagName : '';
    if (focused?.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return;
    }

    let destination = '';
    let label = '';

    if (event.key === 'ArrowLeft') {
      destination = links.previousHref;
      label = `^[route/${String(links.previous).padStart(2, '0')}]{prev}`;
    } else if (event.key === 'ArrowRight') {
      destination = links.nextHref;
      label = `^[route/${String(links.next).padStart(2, '0')}]{next}`;
    } else if (event.key === 'Home' || event.key.toLowerCase() === 'h') {
      destination = withSiteBase('/');
      label = '^[home]{lore.land}';
    } else if (event.key.toLowerCase() === 't') {
      destination = withSiteBase('/book/timeline.html');
      label = '&[timeline]{canon-sequence}';
    } else if (event.key.toLowerCase() === 'p') {
      destination = normalizeSpwSource('spw/index');
      label = '@[path]{@spw/index.spw}';
    } else {
      return;
    }

    event.preventDefault();
    if (announce) {
      announce(`Shortcut route: ${label}`);
    }
    window.location.href = destination;
  };

  document.addEventListener('keydown', onKeydown);

  return () => {
    document.removeEventListener('keydown', onKeydown);
    delete document.body.dataset.spwShortcuts;
  };
}

export function setupNavigation(data, announce) {
  const links = deriveChapterLinks(data);
  const previousLabel = `← Chapter ${String(links.previous).padStart(2, '0')}`;
  const nextLabel = `Chapter ${String(links.next).padStart(2, '0')} →`;

  const prevControls = document.querySelectorAll('.chapter-navigation .prev');
  const nextControls = document.querySelectorAll('.chapter-navigation .next');

  prevControls.forEach((control) => {
    bindRouteControl(control, {
      href: links.previousHref,
      label: previousLabel,
      routeName: 'prev',
      ariaLabel: `Open chapter ${links.previous}`
    }, announce);
  });

  nextControls.forEach((control) => {
    bindRouteControl(control, {
      href: links.nextHref,
      label: nextLabel,
      routeName: 'next',
      ariaLabel: `Open chapter ${links.next}`
    }, announce);
  });

  setupKeyboardRoutes(links, announce);
}

export function setupSpwHypertextRoutes(data, announce) {
  const aside = document.querySelector('aside');
  if (!aside) {
    return;
  }

  const existing = aside.querySelector('.spw-hypertext-routes');
  if (existing) {
    existing.remove();
  }

  const links = deriveChapterLinks(data);

  const section = document.createElement('section');
  section.className = 'spw-hypertext-routes';
  section.dataset.component = 'spw-hypertext-routes';
  section.setAttribute('aria-label', 'Spw hypertext routes');

  const heading = document.createElement('h2');
  heading.textContent = 'Spw Routes';

  const lead = document.createElement('p');
  lead.textContent = 'Hypertext routes in Spw form for learnable, composable navigation.';

  const shortcutHint = document.createElement('p');
  shortcutHint.className = 'spw-shortcut-hint';
  shortcutHint.textContent =
    'Shortcuts: Alt+Left/Right = chapter, PageUp/Down or [/] = section, hold { = breadth, hold } = depth, Alt+H = home, Alt+T = timeline, Alt+P = .spw canon.';

  const list = document.createElement('ul');

  const routeItems = [
    {
      label: `^[route/${String(links.previous).padStart(2, '0')}]{prev}`,
      href: links.previousHref,
      aria: `Open chapter ${links.previous}`
    },
    {
      label: `^[route/${String(links.next).padStart(2, '0')}]{next}`,
      href: links.nextHref,
      aria: `Open chapter ${links.next}`
    },
    {
      label: '&[timeline]{canon-sequence}',
      href: withSiteBase('/book/timeline.html'),
      aria: 'Open canonical timeline'
    },
    {
      label: '@[path]{@spw/index.spw}',
      href: normalizeSpwSource('spw/index'),
      aria: 'Open Spw canon root for lore.land'
    },
    {
      label: '@[path]{@spw/chapters/index.spw}',
      href: normalizeSpwSource('spw/chapters/index'),
      aria: 'Open Spw chapter reference index'
    },
    {
      label: '~[seed-atlas]{visual motifs}',
      href: withSiteBase('/seeds/2026-02-28/'),
      aria: 'Open seed atlas'
    },
    {
      label: '^[home]{lore.land}',
      href: withSiteBase('/'),
      aria: 'Return to home'
    },
    {
      label: '^[author]{spwashi.com}',
      href: 'https://spwashi.com',
      aria: 'Open story author site'
    },
    {
      label: '~[toy-links]{spwashi.click}',
      href: 'https://spwashi.click',
      aria: 'Open Spwashi toy links page'
    }
  ];

  routeItems.forEach((item) => {
    const li = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = item.href;
    anchor.textContent = item.label;
    anchor.setAttribute('aria-label', item.aria);
    anchor.dataset.spwRoute = item.label;
    anchor.dataset.spwExpression = 'true';
    if (/^https?:\/\//.test(item.href)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    anchor.addEventListener('focus', () => {
      if (announce) {
        announce(`Route focused: ${item.label}`);
      }
    });
    li.append(anchor);
    list.append(li);
  });

  section.append(heading, lead, shortcutHint, list);
  aside.append(section);
}

export function setupPrimaryAction(data) {
  const primaryActionButton = document.querySelector('.primary-action');
  const links = deriveChapterLinks(data);

  if (!primaryActionButton) {
    console.warn('Primary action button not found.');
    return;
  }

  if (primaryActionButton.tagName === 'A' && primaryActionButton.getAttribute('href')) {
    return;
  }

  primaryActionButton.textContent = `Carry on to Chapter ${String(links.next).padStart(2, '0')}`;
  primaryActionButton.setAttribute('aria-label', `Advance to chapter ${links.next}`);

  primaryActionButton.addEventListener('click', () => {
    window.location.href = data.nextChapter || links.nextHref;
  });
}
