import type { Request, Response } from 'express';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

const diagnosticPath = '/api/__diagnostic/neon-select-one';
let appPromise: Promise<unknown> | undefined;

const safeErrorCodes = new Set([
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_HAS_EXPIRED',
  'SELF_SIGNED_CERT_IN_CHAIN',
  '28P01',
  '28000',
  '42501',
]);

function toSanitizedError(error: unknown) {
  const record = error as {
    name?: unknown;
    code?: unknown;
    cause?: { code?: unknown; cause?: { code?: unknown } };
    sourceError?: { code?: unknown; cause?: { code?: unknown } };
    message?: unknown;
  };
  const candidates = [
    record?.code,
    record?.cause?.code,
    record?.cause?.cause?.code,
    record?.sourceError?.code,
    record?.sourceError?.cause?.code,
  ];
  const code = candidates.find((candidate): candidate is string =>
    typeof candidate === 'string' && safeErrorCodes.has(candidate)
  ) ?? null;
  const safeNames = new Set(['NeonDbError', 'TypeError', 'Error', 'AbortError', 'TimeoutError']);
  const errorType = typeof record?.name === 'string' && safeNames.has(record.name)
    ? record.name
    : 'OtherError';
  const message = typeof record?.message === 'string' ? record.message : '';
  let errorMessageCategory = 'other';

  if (code === 'UND_ERR_SOCKET' || code === 'ECONNRESET') errorMessageCategory = 'socket';
  else if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') errorMessageCategory = 'dns';
  else if (code?.startsWith('ERR_TLS') || code?.includes('CERT')) errorMessageCategory = 'tls';
  else if (code === '28P01' || code === '28000') errorMessageCategory = 'authentication';
  else if (code === '42501') errorMessageCategory = 'authorization';
  else if (/HTTP status 401\b/.test(message)) errorMessageCategory = 'authentication';
  else if (/HTTP status 403\b/.test(message)) errorMessageCategory = 'authorization';
  else if (/HTTP status [45]\d\d\b/.test(message)) errorMessageCategory = 'http-response';
  else if (errorType === 'TypeError') errorMessageCategory = 'fetch';

  return { errorType, errorCode: code, errorMessageCategory };
}

async function runSelectOneProbe(res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  const databaseUrl = process.env.DATABASE_URL;
  const report = {
    databaseUrlExists: Boolean(databaseUrl),
    driver: 'neon-http',
    queryStarted: false,
    querySucceeded: false,
    resultReceived: false,
    errorType: null as string | null,
    errorCode: null as string | null,
    errorMessageCategory: null as string | null,
  };

  if (databaseUrl) {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(databaseUrl);
      report.queryStarted = true;
      const rows = await sql`SELECT 1`;
      report.querySucceeded = true;
      report.resultReceived = Array.isArray(rows) && rows.length > 0;
    } catch (error) {
      Object.assign(report, toSanitizedError(error));
    }
  }

  console.info('[temporary Neon SELECT 1 probe]', JSON.stringify(report));
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
    return runSelectOneProbe(res);
  }

  appPromise ??= loadApp();
  const app = await appPromise;
  return (app as (request: Request, response: Response) => unknown)(req, res);
}
