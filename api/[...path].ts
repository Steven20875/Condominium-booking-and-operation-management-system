import type { Express, Request, Response } from 'express';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

let appPromise: Promise<Express> | undefined;

async function loadApp(): Promise<Express> {
  const { createApp } = await import('../server-build/server.mjs');
  return createApp();
}

export default async function handler(req: Request, res: Response) {
  if (!appPromise) {
    appPromise = loadApp();
  }

  const initialization = appPromise;
  let app: Express;

  try {
    app = await initialization;
  } catch (error) {
    if (appPromise === initialization) {
      appPromise = undefined;
    }
    throw error;
  }

  return app(req, res);
}
