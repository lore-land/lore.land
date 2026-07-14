import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const chapterInputs = Object.fromEntries(
    readdirSync(resolve(__dirname, 'book/chapter'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^\d{2}$/.test(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((entry) => [
            `chapter${entry.name}`,
            resolve(__dirname, `book/chapter/${entry.name}/index.html`),
        ])
);

export default defineConfig({
    // Serve from root — the site is a static MPA
    root: '.',
    publicDir: false, // no separate public dir, everything is at root

    server: {
        port: 3000,
        open: '/',
    },

    build: {
        // Multi-page app — each chapter is an entry point
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                civicMagic: resolve(__dirname, 'world/civic-magic.html'),
                boonberryCommons: resolve(__dirname, 'world/boonberry-commons.html'),
                scriptorium: resolve(__dirname, 'scriptorium/index.html'),
                topics: resolve(__dirname, 'topics/index.html'),
                boof: resolve(__dirname, 'characters/boof.html'),
                ...chapterInputs,
            },
        },
        outDir: 'dist',
    },
});
