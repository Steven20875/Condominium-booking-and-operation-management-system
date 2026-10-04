import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';

process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

const preflightPath = '/api/__diagnostic/resident-deletion-preflight';
let appPromise: Promise<unknown> | undefined;

async function runReadOnlyPreflight(res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return res.status(503).json({ databaseUrlExists: false });

  try {
    const parsed = new URL(databaseUrl);
    const endpointFingerprint = createHash('sha256')
      .update(`${parsed.protocol}//${parsed.hostname}${parsed.pathname}`)
      .digest('hex');
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);
    const [snapshotRows, normalizedRoleRows, unitsRows, dependentRows, fkRows] = await Promise.all([
      sql`SELECT state FROM application_state WHERE id = ${'application'}` as Promise<Array<{ state: unknown }>>,
      sql`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role`,
      sql`SELECT COUNT(*)::int AS count FROM units`,
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM bookings b JOIN users u ON u.id = b.resident_id WHERE u.role = 'resident') AS bookings,
          (SELECT COUNT(*)::int FROM payments p JOIN users u ON u.id = p.resident_id WHERE u.role = 'resident') AS payments,
          (SELECT COUNT(*)::int FROM maintenance_requests m JOIN users u ON u.id = m.resident_id WHERE u.role = 'resident') AS maintenance_requests,
          (SELECT COUNT(*)::int FROM government_id_submissions g JOIN users u ON u.id = g.user_id WHERE u.role = 'resident') AS government_id_submissions,
          (SELECT COUNT(*)::int FROM notification_reads nr JOIN users u ON u.id = nr.user_id WHERE u.role = 'resident') AS notification_reads,
          (SELECT COUNT(*)::int FROM activity_logs a JOIN users u ON u.id = a.user_id WHERE u.role = 'resident') AS activity_logs
      `,
      sql`
        SELECT tc.table_name AS table_name, kcu.column_name AS column_name, rc.delete_rule AS delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_catalog = kcu.constraint_catalog
          AND tc.constraint_schema = kcu.constraint_schema
          AND tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_catalog = tc.constraint_catalog
          AND ccu.constraint_schema = tc.constraint_schema
          AND ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_catalog = tc.constraint_catalog
          AND rc.constraint_schema = tc.constraint_schema
          AND rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'users'
        ORDER BY tc.table_name, kcu.column_name
      `,
    ]);

    const state = snapshotRows[0]?.state as { users?: Array<{ role?: string }>; units?: unknown[] } | undefined;
    const snapshotUsers = Array.isArray(state?.users) ? state.users : [];
    const roleCounts = snapshotUsers.reduce<Record<string, number>>((counts, user) => {
      const role = typeof user.role === 'string' ? user.role : 'missing';
      counts[role] = (counts[role] || 0) + 1;
      return counts;
    }, {});
    const report = {
      databaseUrlExists: true,
      endpointFingerprint,
      stateFingerprint: createHash('sha256').update(JSON.stringify(state)).digest('hex'),
      snapshot: {
        residentCount: roleCounts.resident || 0,
        adminCount: roleCounts.admin || 0,
        otherRoleCounts: Object.fromEntries(Object.entries(roleCounts).filter(([role]) => role !== 'resident' && role !== 'admin')),
        unitCount: Array.isArray(state?.units) ? state.units.length : null,
      },
      normalizedTables: {
        usersByRole: normalizedRoleRows,
        unitCount: unitsRows[0]?.count ?? null,
        residentDependents: dependentRows[0] ?? null,
        userForeignKeys: fkRows,
      },
    };
    console.info('[temporary resident deletion preflight]', JSON.stringify(report));
    return res.status(200).json(report);
  } catch (error) {
    const value = error as { name?: unknown; code?: unknown; cause?: { code?: unknown; cause?: { code?: unknown } } };
    const candidates = [value?.code, value?.cause?.code, value?.cause?.cause?.code];
    const safeCodes = new Set(['UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']);
    const errorCode = candidates.find((code): code is string => typeof code === 'string' && safeCodes.has(code)) ?? null;
    const names = new Set(['NeonDbError', 'TypeError', 'Error', 'AbortError', 'TimeoutError']);
    const errorType = typeof value?.name === 'string' && names.has(value.name) ? value.name : 'OtherError';
    console.info('[temporary resident deletion preflight]', JSON.stringify({ databaseUrlExists: true, errorType, errorCode }));
    return res.status(503).json({ databaseUrlExists: true, errorType, errorCode });
  }
}

async function loadApp() {
  const { createApp } = await import('../server-build/server.mjs');
  return createApp();
}

export default async function handler(req: Request, res: Response) {
  const requestPath = new URL(req.url || '/', 'https://vercel.invalid').pathname;
  if (requestPath === preflightPath) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    return runReadOnlyPreflight(res);
  }

  if (!appPromise) {
    appPromise = loadApp();
  }

  const initialization = appPromise;
  let app: Awaited<ReturnType<typeof loadApp>>;
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
