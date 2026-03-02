/**
 * book-scroll-observer.mjs — IntersectionObserver for semantic scroll reveal.
 *
 * Observes chapter content elements and sets data-spw-visible="true" when
 * they enter the viewport. Also tracks reading progress as a CSS custom
 * property for the progress bar and lifecycle stage breadcrumb.
 *
 * Respects prefers-reduced-motion: if reduce, all elements are immediately
 * made visible and no observer is created.
 */

const OBSERVE_SELECTORS = [
    'section',
    'custom-boof',
    'custom-fool',
    'custom-boonberry',
    'custom-echo',
    'custom-song',
    'custom-paradox',
    'custom-bonk',
    'custom-game',
    'custom-puzzle',
    'custom-awakening',
    'custom-path',
    'custom-reflection',
    'figure',
].join(', ');

/**
 * Initializes the scroll observer for chapter content.
 *
 * @param {HTMLElement} root — the chapter content root
 * @returns {Function} cleanup function
 */
export function initBookScrollObserver(root) {
    if (!root) return () => { };

    const elements = [...root.querySelectorAll(OBSERVE_SELECTORS)];
    if (!elements.length) return () => { };

    // Respect reduced motion — show everything immediately
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        for (const el of elements) {
            el.dataset.spwVisible = 'true';
        }
        return () => { };
    }

    // Assign staggered entrance delays based on DOM order
    elements.forEach((el, index) => {
        el.style.setProperty('--entrance-delay', String(index * 80));
    });

    // Create intersection observer
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.dataset.spwVisible = 'true';
                    observer.unobserve(entry.target); // once revealed, stay revealed
                }
            }
        },
        { threshold: 0.15 }
    );

    for (const el of elements) {
        observer.observe(el);
    }

    // Track reading progress
    let rafId = null;
    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
        document.documentElement.style.setProperty('--reading-progress', String(progress));
    };

    const onScroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            updateProgress();
            rafId = null;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();

    return () => {
        observer.disconnect();
        window.removeEventListener('scroll', onScroll);
        if (rafId) cancelAnimationFrame(rafId);
    };
}
