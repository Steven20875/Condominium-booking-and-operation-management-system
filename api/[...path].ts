import type { Request, Response } from 'express';
import { createApp } from '../server-build/server.mjs';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: Request, res: Response) {
  if (!appPromise) {
    appPromise = createApp();
  }

  const initialization = appPromise;
  let app: Awaited<ReturnType<typeof createApp>>;
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
