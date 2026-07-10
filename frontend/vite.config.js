import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Raise warning threshold to 600 kB (default is 500 kB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core runtime
          "vendor-react": ["react", "react-dom"],
          // Routing
          "vendor-router": ["react-router-dom"],
          // Charts
          "vendor-recharts": ["recharts"],
          // Animations
          "vendor-framer": ["framer-motion"],
          // Icons (lucide ships many icons — split separately)
          "vendor-lucide": ["lucide-react"],
          // HTTP client
          "vendor-axios": ["axios"],
          // Toast notifications
          "vendor-toast": ["react-toastify"],
        },
      },
    },
  },
});

