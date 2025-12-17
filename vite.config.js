import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative base path so it works in subdirectories (like on GitHub Pages)
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
