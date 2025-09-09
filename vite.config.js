import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// We deploy under nginx root: /opt/yliyun/work/nginx/ with web path /plugins/fts/
// Use base '/plugins/fts/' for production builds so asset URLs resolve correctly.
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    base: isProd ? '/plugins/fts/' : '/',
    plugins: [vue()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,            // easier debugging in test env
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-ui': ['element-plus', '@element-plus/icons-vue']
          }
        }
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/rag': {
          target: 'http://192.168.1.26:48080/',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/rag/, ''),
        },
        '/apps': {
          target: 'http://192.168.1.26/',
          changeOrigin: true,
        },
        '/group1': {
          target: 'http://192.168.1.26/',
          changeOrigin: true,
        },
      }
    }
  };
});