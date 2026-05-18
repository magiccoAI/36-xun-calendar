import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3001,
    open: true
  },
  base: './', // Use relative paths for file:// protocol support
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false
  }
});
