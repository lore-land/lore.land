const NS = 'http://www.w3.org/2000/svg';

function createSvgNode(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

export function createFrameSvg() {
  const svg = createSvgNode('svg', {
    viewBox: '0 0 1200 320',
    class: 'hero-frame-svg',
    'aria-hidden': 'true'
  });

  const defs = createSvgNode('defs');
  const gradient = createSvgNode('linearGradient', { id: 'flowGradient', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
  gradient.append(
    createSvgNode('stop', { offset: '0%', 'stop-color': '#88ffe8' }),
    createSvgNode('stop', { offset: '50%', 'stop-color': '#79a8ff' }),
    createSvgNode('stop', { offset: '100%', 'stop-color': '#c990ff' })
  );

  defs.append(gradient);
  svg.append(defs);

  svg.append(
    createSvgNode('path', {
      d: 'M32 180 C 220 64, 380 256, 560 160 S 920 66, 1168 174',
      fill: 'none',
      stroke: 'url(#flowGradient)',
      'stroke-width': '6',
      'stroke-linecap': 'round',
      opacity: '0.8'
    }),
    createSvgNode('path', {
      d: 'M32 240 C 200 126, 380 310, 560 216 S 920 122, 1168 234',
      fill: 'none',
      stroke: 'url(#flowGradient)',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      opacity: '0.45'
    })
  );

  return svg;
}
