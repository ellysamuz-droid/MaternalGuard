import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React 19 + React Compiler (auto-memoization, tanpa useMemo/useCallback manual)
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}],
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
