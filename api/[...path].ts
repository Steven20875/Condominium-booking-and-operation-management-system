import type { Request, Response } from 'express';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

const diagnosticPath = '/api/__diagnostic/neon-connectivity';
let appPromise: Promise<unknown> | undefined;

async function runNeonConnectivityProbe(res: Response) {
  res.setHeader('Cache-Control', 'no-store');

  const databaseUrl = process.env.DATABASE_URL;
  const report: Record<string, unknown> = {
    databaseUrlExists: Boolean(databaseUrl),
    hostnameCategory: 'unavailable',
    protocol: 'unavailable',
    derivedEndpointCategory: 'unavailable',
    fetchStarted: false,
    httpResponseReceived: false,
    httpStatus: null,
    errorType: null,
    errorCode: null,
  };

  if (!databaseUrl) {
    console.info('[temporary Neon connectivity probe]', JSON.stringify(report));
    return res.status(200).json(report);
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const protocol = parsedUrl.protocol === 'postgres:' || parsedUrl.protocol === 'postgresql:'
      ? parsedUrl.protocol.slice(0, -1)
      : 'other';
    report.protocol = protocol;
    report.hostnameCategory = parsedUrl.hostname.includes('-pooler.') ? 'pooler' : 'non-pooler';

    if (protocol === 'other') {
      console.info('[temporary Neon connectivity probe]', JSON.stringify(report));
      return res.status(200).json(report);
    }

    const { neonConfig } = await import('@neondatabase/serverless');
    const endpointBuilder = neonConfig.fetchEndpoint;
    const endpoint = typeof endpointBuilder === 'function'
      ? new URL(endpointBuilder(parsedUrl.hostname, parsedUrl.port))
      : new URL(`https://api.${parsedUrl.hostname}/sql`);
    const isNeonSqlEndpoint = endpoint.protocol === 'https:'
      && endpoint.hostname.startsWith('api.')
      && endpoint.hostname.endsWith('.neon.tech')
      && endpoint.pathname === '/sql';
    report.derivedEndpointCategory = isNeonSqlEndpoint ? 'Neon SQL HTTP endpoint' : 'other HTTPS endpoint';
    report.fetchStarted = true;

    const response = await fetch(endpoint, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    });
    report.httpResponseReceived = true;
    report.httpStatus = response.status;
    await response.body?.cancel();
  } catch (error) {
    const errorRecord = error as { name?: unknown; code?: unknown; cause?: { code?: unknown } };
    const allowedTypes = new Set(['Error', 'TypeError', 'AbortError', 'TimeoutError']);
    const rawCode = errorRecord?.code ?? errorRecord?.cause?.code;
    report.errorType = typeof errorRecord?.name === 'string' && allowedTypes.has(errorRecord.name)
      ? errorRecord.name
      : 'OtherError';
    report.errorCode = typeof rawCode === 'string' && /^[A-Z0-9_-]{1,40}$/.test(rawCode)
      ? rawCode
      : null;
  }

  console.info('[temporary Neon connectivity probe]', JSON.stringify(report));
  return res.status(200).json(report);
}

async function loadApp() {
  const { createApp } = await import('../server-build/server.mjs');
  return createApp();
}

export default async function handler(req: Request, res: Response) {
  const requestPath = new URL(req.url || '/', 'https://vercel.invalid').pathname;
  if (requestPath === diagnosticPath) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    return runNeonConnectivityProbe(res);
  }

  appPromise ??= loadApp();
  const app = await appPromise;
  return (app as (request: Request, response: Response) => unknown)(req, res);
}
