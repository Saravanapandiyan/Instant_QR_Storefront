import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: resolve(import.meta.dirname, 'index.html'),
                pricing: resolve(import.meta.dirname, 'pricing.html'),
                faq: resolve(import.meta.dirname, 'faq.html'),
            },
        },
    },
});
