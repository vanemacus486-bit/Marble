import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 渲染层（Vue）用 Vite 打包；base 设为相对路径，Electron 才能用 file:// 加载。
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [vue()],
  build: {
    outDir: resolve(__dirname, 'out/renderer'),
    emptyOutDir: true,
  },
});
