import postcssimport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import tailwindcss from '@tailwindcss/postcss';

/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: [postcssimport, tailwindcss, autoprefixer]
};

export default config;
