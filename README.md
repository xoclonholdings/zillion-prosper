# ZILLION Prosper

ZILLION Prosper is the canonical Capital galaxy for budgeting, investing research, market intelligence, paper trading, trading education, strategy validation, broker connections, and governed capital workflows.

ZAR is the authenticated conversational front door. It launches ZILLION with a short-lived, owner-bound grant and delegates Finance requests through the typed Capital capability. ZILLION calls shared ZCOS model, web, knowledge, and approval authorities through signed, owner-bound requests.

## Safety boundary

Live trading is fail-closed. `server/zcos/trading/LiveCertification.ts` is an immutable certification gate and cannot be enabled by an environment variable. A separate production certification and security review are required before real-money execution can be enabled.

No scheduler that could resolve or transmit trades is started by the application.

## Local development

1. Copy `.env.example` to `.env` and set a random `ZILLION_CAPABILITY_SECRET` of at least 32 characters. Configure the same secret in ZAR.
2. Start the ZCOS/ZAR API on port 5000.
3. Run `npm install` and `npm run dev` for the Capital API on port 5001.
4. In a second process, run `npm run dev:client` for the client on port 3000.

Direct anonymous entry is intentionally unavailable. Open ZAR and use its Capital link so ZCOS can issue the owner-bound launch grant. `CAPITAL_DEV_OWNER_ID` is accepted only outside production.

## Verification

```sh
npm run typecheck
npm run build
npm test
```

The Webull harness uses mocked transport and does not place network orders.
Live broker execution remains blocked independently by certification checks.

## Production configuration

- `DATABASE_URL` and `REQUIRE_DATABASE=true`
- `ZILLION_CAPABILITY_SECRET`
- `ZCOS_CAPABILITY_BASE_URL`
- `FRONTEND_URL`
- Client build variables `VITE_API_BASE_URL`, `VITE_ZAR_APP_URL`, and `VITE_ZCOS_PORTAL_URL`

See [SPEC.md](./SPEC.md) and [MIGRATION_MANIFEST.md](./MIGRATION_MANIFEST.md).
