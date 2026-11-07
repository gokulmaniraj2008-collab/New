import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: [
      '3000-ip35mipk2hp788mwz9bk5-6452d98c.sg2.manus.computer',
      '8328-ip35mipk2hp788mwz9bk5-6452d98c.sg2.manus.computer',
    ],
  },
  build: {
    // The core Three.js chunk is lazy-loaded with the 3D viewer; gzip reduces it to ~180 KB.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/examples/')) return 'three-extras-vendor';
          if (id.includes('/node_modules/three-stdlib/')) return 'three-stdlib-vendor';
          if (id.includes('/node_modules/three/')) return 'three-vendor';
          if (id.includes('/node_modules/@react-three/')) return 'react-three-vendor';
          if (id.includes('/node_modules/gsap/')) return 'gsap-vendor';
          return undefined;
        },
      },
    },
  },
});
