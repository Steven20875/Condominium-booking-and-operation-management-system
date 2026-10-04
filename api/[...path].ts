import type { Request, Response } from 'express';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

const diagnosticPath = '/api/__diagnostic/application-state-read';
let appPromise: Promise<unknown> | undefined;

function sanitizedFailure(error: unknown) {
  const value = error as {
    name?: unknown;
    code?: unknown;
    cause?: { code?: unknown; cause?: { code?: unknown } };
    sourceError?: { code?: unknown; cause?: { code?: unknown } };
  };
  const possibleCodes = [
    value?.code,
    value?.cause?.code,
    value?.cause?.cause?.code,
    value?.sourceError?.code,
    value?.sourceError?.cause?.code,
  ];
  const safeCodes = new Set([
    'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT', 'ECONNRESET', 'ETIMEDOUT',
    'ENOTFOUND', 'EAI_AGAIN', 'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED',
  ]);
  const errorCode = possibleCodes.find((code): code is string =>
    typeof code === 'string' && (safeCodes.has(code) || /^[0-9A-Z]{5}$/.test(code))
  ) ?? null;
  const allowedNames = new Set(['NeonDbError', 'TypeError', 'Error', 'AbortError', 'TimeoutError']);
  const errorType = typeof value?.name === 'string' && allowedNames.has(value.name)
    ? value.name
    : 'OtherError';
  return { errorType, errorCode };
}

async function runApplicationStateReadProbe(res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  const report = {
    queryStarted: false,
    querySucceeded: false,
    resultReceived: false,
    rowCount: 0,
    approximateStateBytes: null as number | null,
    jsonParsingSucceeded: null as boolean | null,
    errorType: null as string | null,
    errorCode: null as string | null,
  };

  try {
    const databaseUrl = process.env.DATABASE_URL;
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);
    report.queryStarted = true;
    const rows = await sql`SELECT state FROM application_state WHERE id = ${'application'}` as Array<{ state: unknown }>;
    report.querySucceeded = true;
    report.rowCount = rows.length;
    report.resultReceived = rows.length > 0;

    if (rows.length > 0) {
      const serializedState = JSON.stringify(rows[0].state);
      if (typeof serializedState === 'string') {
        report.approximateStateBytes = Buffer.byteLength(serializedState, 'utf8');
        try {
          JSON.parse(serializedState);
          report.jsonParsingSucceeded = true;
        } catch {
          report.jsonParsingSucceeded = false;
        }
      } else {
        report.jsonParsingSucceeded = false;
      }
    }
  } catch (error) {
    Object.assign(report, sanitizedFailure(error));
  }

  console.info('[temporary application_state read probe]', JSON.stringify(report));
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
    return runApplicationStateReadProbe(res);
  }

  appPromise ??= loadApp();
  const app = await appPromise;
  return (app as (request: Request, response: Response) => unknown)(req, res);
}
