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

ZILLION owns budgeting, investing, market intelligence, paper trading, trading education, strategy validation, broker connections, and governed capital workflows.

ZAR is the authenticated operator and conversational front door. It launches ZILLION with a short-lived, owner-bound grant and delegates Finance requests through the typed Capital capability. ZILLION calls shared ZCOS model, web, knowledge, and approval authorities through signed, owner-bound requests.

The user does not have to understand provider adapters, evaluation stages, ingestion pipelines, or governance internals. When an action requires data, credentials, authorization, a connected account, or another prerequisite, ZAR asks for the missing input at the point it is needed.

## Trading experience

The normal user-facing Trade entry is intentionally simple:

`Trade -> Live | Simulation`

Tapping **Trade** in the PROSPER Dock exposes **LIVE** and **SIMULATION** inside the Dock interaction. Internal learning, strategy, sandbox, external-paper, evaluation, qualification, governance, validation, provider, and certification machinery remains implementation detail rather than primary user navigation.

Simulation uses isolated simulated capital. Live uses real connected-account data and real broker execution only.

### Live setup

Live is implemented as a complete prerequisite-driven flow rather than a dead blocked page:

1. ZAR checks Live readiness.
2. If no broker is connected, ZAR asks the user to connect Webull or Tradovate and supplies the required connection fields.
3. Connected Webull accounts are verified against the provider.
4. Account positions and recent order history are retrieved from Webull's account APIs when the required access token is available.
5. Market quotes use the configured market-data service.
6. ZAR asks for any remaining qualification, production-certification, or risk-control requirement before a real order can be transmitted.
7. Every Live order still requires an explicit user submit action and passes the server-side execution gates.

`ZILLION_LIVE_TRADING_CERTIFIED` is fail-closed (`false`) by default and is an explicit production operator setting. It is not a compile-time permanent blocker. Set it to `true` only after the deployment/security certification for real-money execution is complete.

No autonomous scheduler that transmits live trades is started by the application.

## Investing experience

Invest is wired to verified holdings instead of placeholder values. It retrieves current Webull positions when a brokerage connection is available. If no holdings source is connected, ZAR asks the user to either connect the brokerage account or provide a statement through the canonical ZCOS Upload flow. The UI never invents a balance or holding.

## Shared ZCOS authorities

Identity, Memory, Knowledge, Apps, Settings, Portal transport, model access, web search, approvals, and audit remain governed by ZCOS. ZILLION presents the shared domains in its galaxy while preserving their canonical owners.

Shared-domain selections transition directly into the corresponding ZCOS authority with `galaxy=ZILLION` and `desk=CAPITAL` context. Chat uses the same ZAR identity and Upload uses the canonical ZCOS intake rather than a duplicate ZILLION pipeline.

## Current implementation status

- ZILLION celestial galaxy and seven-domain manifest: implemented.
- CAPITAL Desk: implemented.
- PROSPER Dock: implemented with the locked five-control order.
- Chat: wired to the same ZAR identity with ZILLION/CAPITAL context.
- Upload: wired to canonical ZCOS intake.
- Budget: implemented against the ZILLION budget system.
- Trade / Simulation: implemented over the existing Trading Intelligence and paper-trading systems.
- Trade / Live: implemented as a broker-connected prerequisite-driven workspace; production execution requires the explicit operator certification setting plus all live governance gates.
- Invest: implemented against verified connected Webull positions, with brokerage-connect and statement-upload acquisition paths when ZAR needs a holdings source.
- Shared domains: wired to their canonical ZCOS authorities.

## Local development

1. Copy `.env.example` to `.env` and set a random `ZILLION_CAPABILITY_SECRET` of at least 32 characters. Configure the same secret in ZAR.
2. Start the ZCOS/ZAR API on port 5000.
3. Run `npm install` and `npm run dev` for the Capital API on port 5001.
4. In a second process, run `npm run dev:client` for the client on port 3000.

Direct anonymous entry is intentionally unavailable. Open ZAR and use its Capital link so ZCOS can issue the owner-bound launch grant. `CAPITAL_DEV_OWNER_ID` is accepted only outside production.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

A GitHub Actions verification workflow also runs these commands on pushes to `main` when Actions runners are available for the repository.

## Production configuration

- `DATABASE_URL` and `REQUIRE_DATABASE=true`
- `ZILLION_CAPABILITY_SECRET`
- `ZCOS_CAPABILITY_BASE_URL`
- `FRONTEND_URL`
- `ZILLION_LIVE_TRADING_CERTIFIED=true` only after production/security certification
- Client build variables `VITE_API_BASE_URL`, `VITE_ZAR_APP_URL`, and `VITE_ZCOS_PORTAL_URL`

See [SPEC.md](./SPEC.md) and [MIGRATION_MANIFEST.md](./MIGRATION_MANIFEST.md).
