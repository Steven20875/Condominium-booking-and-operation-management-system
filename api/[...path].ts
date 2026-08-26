import type { Request, Response } from 'express';
async function loadApp() {
  process.env.NODE_ENV = 'production';
  process.env.VERCEL = '1';
  const { createApp } = await import('../server-build/server.mjs');
  return createApp();
}

let appPromise: ReturnType<typeof loadApp> | undefined;

export default async function handler(req: Request, res: Response) {
  appPromise ??= loadApp();
  const app = await appPromise;
  return app(req, res);
}
