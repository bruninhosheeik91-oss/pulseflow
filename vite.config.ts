import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Diretórios do backend que o watcher do Vite não deve observar.
// Impede EBUSY quando o WPPConnect/Chromium grava em server/tokens.
const WATCH_IGNORED = [
  '**/server/tokens/**',
  '**/server/tokens/**/*',
  '**/tokens/**',
  '**/tokens/**/*',
  '**/server/node_modules/**',
  '**/server/logs/**',
];

const watchConfig = () =>
  process.env.DISABLE_HMR === 'true' ? null : {ignored: WATCH_IGNORED};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: watchConfig(),
    },
  };
});
