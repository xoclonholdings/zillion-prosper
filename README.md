# ZILLION

ZILLION is the ZCOS Capital galaxy. It uses the seven shared ZCOS domains:

- Identity
- Memory
- Knowledge
- Apps
- Desk
- Settings
- Portal

Inside ZILLION, the shared **Desk** domain resolves to the **CAPITAL Desk**. The persistent five-control Dock is **PROSPER**:

`Chat | Upload | Budget | Trade | Invest`

PROSPER is the Dock, not a planet. CAPITAL is the specialized Desk, not an eighth domain. Budget, Trade, and Invest are CAPITAL functions surfaced through PROSPER.

## Capital ownership

ZILLION owns budgeting, investing research, market intelligence, paper trading, trading education, strategy validation, broker connections, and governed capital workflows.

ZAR is the authenticated operator and conversational front door. It launches ZILLION with a short-lived, owner-bound grant and delegates Finance requests through the typed Capital capability. ZILLION calls shared ZCOS model, web, knowledge, and approval authorities through signed, owner-bound requests.

## Trading experience

The normal user-facing Trade entry is intentionally simple:

`Trade -> Live | Simulation`

Tapping **Trade** in the PROSPER Dock exposes **LIVE** and **SIMULATION** inside the Dock interaction. Internal learning, strategy, sandbox, external-paper, evaluation, qualification, governance, validation, provider, and certification machinery remains implementation detail rather than primary user navigation.

Simulation uses isolated simulated capital. Live represents real capital only and remains blocked until separately certified.

## Safety boundary

Live trading is fail-closed. `server/zcos/trading/LiveCertification.ts` is an immutable certification gate and cannot be enabled by an environment variable. A separate production certification and security review are required before real-money execution can be enabled.

No scheduler that could resolve or transmit trades is started by the application.

## Shared ZCOS authorities

Identity, Memory, Knowledge, Apps, Settings, Portal transport, model access, web search, approvals, and audit remain governed by ZCOS. ZILLION presents the shared domains in its galaxy while preserving their canonical owners.

Chat uses the same ZAR identity with ZILLION/CAPITAL context. Upload uses the canonical ZCOS intake rather than a duplicate ZILLION pipeline.

## Current implementation status

- ZILLION celestial galaxy and seven-domain manifest: implemented.
- CAPITAL Desk: implemented.
- PROSPER Dock: implemented with the locked five-control order.
- Budget: implemented against the ZILLION budget system.
- Trade / Simulation: implemented over the existing trading intelligence and paper-trading systems.
- Trade / Live: user surface implemented; real-money execution remains intentionally uncertified and blocked.
- Invest: ZILLION owns the surface, but a canonical holdings/portfolio provider is not yet connected. The UI must not fabricate holdings or balances.

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

The Webull harness uses mocked transport and does not place network orders. Live broker execution remains blocked independently by certification checks.

## Production configuration

- `DATABASE_URL` and `REQUIRE_DATABASE=true`
- `ZILLION_CAPABILITY_SECRET`
- `ZCOS_CAPABILITY_BASE_URL`
- `FRONTEND_URL`
- Client build variables `VITE_API_BASE_URL`, `VITE_ZAR_APP_URL`, and `VITE_ZCOS_PORTAL_URL`

See [SPEC.md](./SPEC.md) and [MIGRATION_MANIFEST.md](./MIGRATION_MANIFEST.md).
