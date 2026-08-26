import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.VERCEL': '"1"',
  },
  sourcemap: true,
  outfile: 'server-build/server.mjs',
});
