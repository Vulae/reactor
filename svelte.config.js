import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter(),
        paths: {base: '/reactor'}
    },
    compilerOptions: {
        runes: true,
    },
    preprocess: vitePreprocess({
        style: true
    })
};

export default config;
