/**
 * print-context.mjs — Serializes the current chapter as readable prose.
 *
 * Walks the rendered chapter DOM and extracts text in reading order,
 * annotated with grammar roles. Provides a "Print Context" button
 * that opens a clean text view suitable for printing or copying.
 */

const GRAMMAR_LABELS = Object.freeze({
    narrator: 'narrator',
    interlocutor: 'dialogue',
    modifier: 'environment',
    echo: 'echo',
    melody: 'melody',
    paradox: 'paradox',
    labyrinth: 'maze',
    shadow: 'shadow',
    game: 'game',
    puzzle: 'puzzle',
    bonk: 'bonk',
    awakening: 'awakening',
    path: 'path',
    reflection: 'reflection',
    predicate: 'section',
    illustration: 'figure',
});

/**
 * Extracts readable prose from the chapter DOM.
 *
 * @param {HTMLElement} root — the chapter content container
 * @returns {string} — formatted prose text with role annotations
 */
function extractProse(root) {
    if (!root) return '';

    const lines = [];
    const children = root.querySelectorAll('[data-spw-grammar]');

    for (const el of children) {
        const grammar = el.dataset.spwGrammar || '';
        const label = GRAMMAR_LABELS[grammar] || grammar;

        // For figures, extract the caption
        if (grammar === 'illustration') {
            const caption = el.querySelector('figcaption');
            if (caption) {
                lines.push(`[${label}] ${caption.textContent.trim()}`);
            }
            continue;
        }

        // Extract text content from paragraphs within this element
        const paragraphs = el.querySelectorAll('p');
        if (paragraphs.length) {
            for (const p of paragraphs) {
                const text = p.textContent.trim();
                if (text) {
                    lines.push(`[${label}] ${text}`);
                }
            }
        } else {
            // Fallback: get direct text content
            const text = el.textContent.trim();
            if (text) {
                lines.push(`[${label}] ${text}`);
            }
        }
    }

    return lines.join('\n\n');
}

/**
 * Creates and mounts the Print Context button in the chapter aside.
 *
 * @param {HTMLElement} chapterRoot — the chapter content container
 */
export function setupPrintContext(chapterRoot) {
    if (!chapterRoot) return;

    const aside = document.querySelector('aside');
    if (!aside) return;

    const links = aside.querySelector('.additional-links');
    if (!links) return;

    const button = document.createElement('button');
    button.className = 'print-context-button';
    button.textContent = 'Print Context';
    button.setAttribute('aria-label', 'View printable chapter text');

    button.addEventListener('click', () => {
        const prose = extractProse(chapterRoot);
        if (!prose) return;

        const win = window.open('', '_blank', 'width=640,height=800');
        if (!win) return;

        const title = document.title || 'Chapter';
        win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — Print Context</title>
  <style>
    body {
      font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
      max-width: 65ch;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.7;
      color: #1a2233;
    }
    h1 {
      font-size: 1.6rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #ccc;
      padding-bottom: 0.5rem;
    }
    p {
      margin: 0 0 1em;
      text-indent: 0;
    }
    .role {
      font-size: 0.72rem;
      font-family: monospace;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .role { color: #999; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${prose.split('\n\n').map(line => {
            const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
            if (match) {
                return `<p><span class="role">${match[1]}</span> ${match[2]}</p>`;
            }
            return `<p>${line}</p>`;
        }).join('\n  ')}
</body>
</html>`);
        win.document.close();
    });

    links.appendChild(button);
}
