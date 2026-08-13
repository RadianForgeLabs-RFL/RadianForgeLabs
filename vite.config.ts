// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack/react-query') || id.includes('@tanstack/react-router')) {
              return 'tanstack';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('recharts') || id.includes('embla-carousel')) {
              return 'charts';
            }
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date';
            }
            if (id.includes('react-markdown') || id.includes('remark')) {
              return 'markdown';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      reportCompressedSize: false,
      sourcemap: false,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@tanstack/react-query', '@tanstack/react-router', 'react-markdown'],
      exclude: ['@lovable.dev/cloud-auth-js'],
    },
    server: {
      fs: {
        strict: false,
      },
      proxy: {
        '/api/github-graphql': {
          target: 'https://api.github.com',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api/github-graphql', '/graphql'),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add GitHub token from environment variable
              const githubToken = process.env.GITHUB_TOKEN;
              if (githubToken) {
                proxyReq.setHeader('Authorization', `Bearer ${githubToken}`);
              }
              proxyReq.setHeader('User-Agent', 'RadianForgeLabs-Community');
            });
          },
        },
      },
    },
  },
});
