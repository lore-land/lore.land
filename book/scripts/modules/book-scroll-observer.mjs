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

import { onScrollFrame } from './scroll-coordinator.mjs?v=2026_08_27.A';

const OBSERVE_SELECTORS = [
    ':scope > section',
    ':scope > figure',
    ':scope > [data-voice-shape="block"]'
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
        document.documentElement.style.setProperty('--reading-progress', '0');
        return () => { };
    }

    // Only blocks that start below the fold wait for a reveal; whatever is
    // already on screen stays put (the prose is prerendered and visible).
    const fold = window.innerHeight || 0;
    const pending = elements.filter((el) => el.getBoundingClientRect().top > fold);
    pending.forEach((el, index) => {
        el.dataset.spwReveal = 'pending';
        // Cap stagger so late sections do not wait seconds to animate.
        el.style.setProperty('--entrance-delay', String(Math.min(index * 48, 240)));
    });

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.dataset.spwVisible = 'true';
                    observer.unobserve(entry.target);
                }
            }
        },
        { threshold: 0 }
    );

    for (const el of pending) {
        observer.observe(el);
    }

    let lastProgress = -1;
    const unsubScroll = onScrollFrame((snap) => {
        const progress = snap.progress;
        // Skip style writes when progress has not moved enough to matter.
        if (Math.abs(progress - lastProgress) < 0.002) {
            return;
        }
        lastProgress = progress;
        document.documentElement.style.setProperty('--reading-progress', String(progress));
    });

    return () => {
        observer.disconnect();
        unsubScroll();
    };
}
