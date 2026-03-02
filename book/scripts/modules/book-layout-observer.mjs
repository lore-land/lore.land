/**
 * book-layout-observer.mjs — Size-dependent rendering logic.
 *
 * Sets data attributes on document and chapter elements based on
 * viewport and container dimensions, enabling CSS and JS to
 * respond to layout context without redundant media queries.
 *
 * Data attributes set:
 *   html[data-layout]           — 'phone' | 'tablet' | 'desktop' | 'wide'
 *   html[data-orientation]      — 'portrait' | 'landscape'
 *   html[data-touch]            — 'true' if touch input is primary
 *   html[data-high-dpi]         — 'true' if device pixel ratio ≥ 2
 *   #chapter-content[data-pane] — 'narrow' | 'medium' | 'wide' (content width)
 */

const BREAKPOINTS = Object.freeze({
    phone: 640,   // < 640px
    tablet: 1120,  // 640–1120px
    desktop: 1600,  // 1120–1600px
    // wide: ≥ 1600px
});

/**
 * Determines the current layout tier.
 * @returns {'phone' | 'tablet' | 'desktop' | 'wide'}
 */
function getLayoutTier() {
    const w = window.innerWidth;
    if (w < BREAKPOINTS.phone) return 'phone';
    if (w < BREAKPOINTS.tablet) return 'tablet';
    if (w < BREAKPOINTS.desktop) return 'desktop';
    return 'wide';
}

/**
 * Determines the chapter pane size tier.
 * @param {HTMLElement} container
 * @returns {'narrow' | 'medium' | 'wide'}
 */
function getPaneTier(container) {
    if (!container) return 'medium';
    const w = container.clientWidth;
    if (w < 500) return 'narrow';
    if (w < 800) return 'medium';
    return 'wide';
}

/**
 * Initializes the layout observer.
 *
 * @param {HTMLElement} chapterRoot — the #chapter-content element
 * @returns {Function} cleanup function
 */
export function initLayoutObserver(chapterRoot) {
    const html = document.documentElement;

    // ─── Static attributes (set once) ─────────────────────────

    html.dataset.touch = String(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
    );

    html.dataset.highDpi = String(
        window.devicePixelRatio >= 2
    );

    // ─── Dynamic attributes (update on resize) ───────────────

    function update() {
        // Layout tier
        html.dataset.layout = getLayoutTier();

        // Orientation
        html.dataset.orientation =
            window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';

        // Chapter pane tier
        if (chapterRoot) {
            chapterRoot.dataset.pane = getPaneTier(chapterRoot);
        }
    }

    // Initial update
    update();

    // Throttled resize listener
    let rafId = null;
    const onResize = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            update();
            rafId = null;
        });
    };

    window.addEventListener('resize', onResize, { passive: true });

    // ResizeObserver for more precise container-level tracking
    let ro = null;
    if (chapterRoot && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
            if (chapterRoot) {
                chapterRoot.dataset.pane = getPaneTier(chapterRoot);
            }
        });
        ro.observe(chapterRoot);
    }

    return () => {
        window.removeEventListener('resize', onResize);
        if (rafId) cancelAnimationFrame(rafId);
        if (ro) ro.disconnect();
    };
}
