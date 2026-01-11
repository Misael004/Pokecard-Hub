import { defineConfig } from 'vite';

export default defineConfig({
  // Configuración base para que el proyecto compile correctamente
  base: './', 
  build: {
    outDir: 'dist',
  }
});
