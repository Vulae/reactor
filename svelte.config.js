import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import("@sveltejs/vite-plugin-svelte").Options} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter(),
        alias: {
            '$components/*': './src/components/*'
        },
        paths: {
            base: '/reactor'
        }
    },
    compilerOptions: {
        runes: true
    }
};

export default config;
