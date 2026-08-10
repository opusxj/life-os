# Codebase audit

Cleanup-scale findings live here; feature-scale work lives in
[backlog.md](backlog.md).

Cleared to a clean baseline on 2026-08-09 at John's request, together with
the backlog: no findings are open, deliberately. The 2026-08-09 audit, its
resolved lists and its open items live in git history if ever wanted. Record
new findings here as they arise.

## Open

- `app/error.tsx` ("Go home"): renders a `Link` through Base UI `Button`
  without `nativeButton={false}`, so the console warns about a non-button
  acting as a button whenever the error page shows. One-prop fix; found
  2026-08-10 while chasing an HMR window during the transactions redesign.
