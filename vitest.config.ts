import { defineConfig } from 'vitest/config';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteDecorators } from 'vite-ts-decorators';

export default defineConfig({
  plugins: [
    viteDecorators({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      force: true,          // Optional: Force TypeScript compilation even if decorators aren't detected
      // srcDir: 'src/**/*.ts', // Optional: Glob pattern for finding source files
    }),
    tsconfigPaths(),
  ],
  test: {
    environment: 'node',
    globals: true,
  }
});
