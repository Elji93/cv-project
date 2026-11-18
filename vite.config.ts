import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages : le site est servi sous https://<user>.github.io/<repo>/
// VITE_BASE est fourni par le workflow de déploiement ; './' fonctionne aussi pour n'importe quel sous-dossier.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react(), tailwindcss()],
});
