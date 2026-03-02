import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    // Serve from root — the site is a static MPA
    root: '.',
    publicDir: false, // no separate public dir, everything is at root

    server: {
        port: 3000,
        open: '/book/chapter/01/index.html',
    },

    build: {
        // Multi-page app — each chapter is an entry point
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                chapter01: resolve(__dirname, 'book/chapter/01/index.html'),
                chapter02: resolve(__dirname, 'book/chapter/02/index.html'),
                chapter03: resolve(__dirname, 'book/chapter/03/index.html'),
                chapter04: resolve(__dirname, 'book/chapter/04/index.html'),
                chapter05: resolve(__dirname, 'book/chapter/05/index.html'),
                chapter06: resolve(__dirname, 'book/chapter/06/index.html'),
                chapter07: resolve(__dirname, 'book/chapter/07/index.html'),
                chapter08: resolve(__dirname, 'book/chapter/08/index.html'),
                chapter09: resolve(__dirname, 'book/chapter/09/index.html'),
                chapter10: resolve(__dirname, 'book/chapter/10/index.html'),
                chapter11: resolve(__dirname, 'book/chapter/11/index.html'),
                chapter12: resolve(__dirname, 'book/chapter/12/index.html'),
                chapter13: resolve(__dirname, 'book/chapter/13/index.html'),
            },
        },
        outDir: 'dist',
    },
});
