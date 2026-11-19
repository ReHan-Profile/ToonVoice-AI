import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectDir = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: resolve(projectDir, 'www'),
  base: './',
  build: {
    outDir: resolve(projectDir, 'dist'),
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false
  },
  server: { host: '0.0.0.0', port: 5173 }
});
