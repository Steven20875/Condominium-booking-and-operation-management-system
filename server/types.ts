// Server-side shim to re-export shared types from the client `src/types.ts`.
// Keeps server code from importing deep client paths and avoids bundler/ts resolution issues.
export * from '../src/types.ts';
