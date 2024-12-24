import { defineConfig } from 'vite';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
// import { tscWatch } from 'vite-plugin-tsc-watch';
import { viteDecorators } from 'vite-ts-decorators';

// Vite configuration for library development
export default defineConfig({
  plugins: [
    viteDecorators({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      force: true,          // Optional: Force TypeScript compilation even if decorators aren't detected
      srcDir: 'src/**/*.ts', // Optional: Glob pattern for finding source files
    }),
    // tscWatch(), // Watch TypeScript files for changes
    tsconfigPaths(),
    dts({ rollupTypes: true, tsconfigPath: path.resolve(__dirname, 'tsconfig.json') }),
  ],
  ssr: {
    noExternal: true, // Prevent externalizing all dependencies
  },
  build: {
    // target: 'node', // Target modern browsers
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // Entry point for the library
      formats: ['es', 'cjs'], // Output formats
      fileName: (format, entry) => {
        return `index.${format}.js`; // Use simple file names without path
      },
    },
    rollupOptions: {
      external: [
        'fs',
        'path',
        'http',
        'https',
        'url',
        'zlib',
        'stream',
        'crypto',
        'buffer',
        'events',
        'util',
        'os',
        'net',
        'async_hooks',
        'querystring',
        'express',
        'reflect-metadata',
        'class-transformer',
        'class-validator',
        'body-parser',
        'swagger-ui-express',
        'swagger-ui-dist',
      ],
      output: {
        globals: {
          // 'cross-fetch': 'fetch',
          // 'ioredis': 'Redis',
        },
        // chunkFileNames: '[name].[format].js',
        // manualChunks: (id) => {
        //   // Replace the `src/` part of the path with an empty string
        //   // Ensure it's a valid chunk name (e.g., the relative directory or file name)
        //   const relativePath = id
        //     .replace(process.cwd(), '')
        //     .replace('src/', '');
        //   // Use the module name ex: '/di/decorators/injectable.ts'  to 'di/decorators/injectable'
        //   const chunkName = relativePath
        //     .replace(/^\//, '')
        //     .replace('.ts', '')
        //     .replace('.js', '');
        //   return chunkName;
        // },
      },
    },
    sourcemap: false, // Disable source maps
    emptyOutDir: true, // Clean output directory before building
  },
  resolve: {
    alias: {
      '@di': path.resolve(__dirname, 'src/di'), // Alias for dependency injection
      '@core': path.resolve(__dirname, 'src/core'), // Alias for core functionality
      '@openapi': path.resolve(__dirname, 'src/openapi'), // Alias for OpenAPI decorators
    },
  },
});
