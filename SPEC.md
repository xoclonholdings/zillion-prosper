# ZILLION System Boundary

## Locked hierarchy

ZILLION is the ZCOS Capital galaxy and central celestial identity for this system.

Every ZILLION galaxy view exposes the seven shared ZCOS domains:

1. Identity
2. Memory
3. Knowledge
4. Apps
5. Desk
6. Settings
7. Portal

Inside ZILLION, the shared **Desk** domain resolves to the **CAPITAL Desk**.

The persistent five-control action surface is the **PROSPER Dock**:

`Chat | Upload | Budget | Trade | Invest`

PROSPER is not a planet or eighth domain. CAPITAL is not an extra planet. Budget, Trade, and Invest are CAPITAL Desk functions surfaced through the PROSPER Dock.

History is universal Console activity outside the five Dock controls and does not automatically become Memory.

## Primary Capital experience

The default ZILLION experience is proposal-and-approval, not financial-software operation.

**ZAR does the work. The user makes the meaningful decision.**

The primary interaction model is:

- **Budget** — the user supplies the money/source context ZAR cannot infer; ZAR calculates the allocation and presents **Approve | Change**.
- **Trade** — the user selects **Live | Simulation**; ZAR scans, researches, builds the setup, sizes risk, and presents **Take Trade | Pass**.
- **Invest** — ZAR reads verified holdings, performs the portfolio review, and presents one clear recommended next action; the user may use the plan or pass.

Balances, reports, holdings lists, positions, market details, performance metrics, research, governance, progression, provider status, and other machinery remain secondary detail views. They must not become the default workflow simply because the backend supports them.

If ZAR lacks information, data, credentials, authorization, or another prerequisite needed to complete the requested task, ZAR asks for exactly that missing input and continues. It must not force the user to discover the missing requirement by navigating the system.

## User-facing completion rule

No visible ZILLION action may terminate at a dead button or placeholder-only page.

When a requested Capital action requires something that is not yet available in the current owner context — for example a broker connection, account identifier, access token, market-data source, uploaded statement, authorization, qualification evidence, or production certification — ZAR must identify the missing prerequisite and ask the user for it at the point it is needed.

The interface should expose the task and the next required user action, not the internal engine architecture.

## Canonical ownership

ZILLION owns all runtime code and durable state for:

- Budgeting and treasury allocation
- Investing and holdings access
- Trading education and assessments
- Strategy, thesis, scanner, backtest, validation, and paper-trading systems
- Broker and market-data connections
- Trading progression, journals, performance, qualification, and governance

ZAR does not own or write these domains. It may classify a Finance intent, launch ZILLION, operate Chat in ZILLION/CAPITAL context, or invoke the Capital agent through a ZCOS-issued typed capability.

Capital-specific seed templates travel with this domain implementation. ZYLO Automate remains the authority for registered cross-galaxy workflows and may invoke ZILLION through the typed Capital capability.

## Shared ZCOS authorities

Identity, global Memory, shared Knowledge, Apps/Extensions, Settings, Portal transport, model access, web search, approvals, and audit remain ZCOS authorities.

ZILLION presents the seven shared domains in its galaxy but does not duplicate their canonical records. Shared-domain navigation passes the active `galaxy=ZILLION` and `desk=CAPITAL` context into the canonical ZCOS authority.

ZILLION accesses shared authorities only through signed calls whose canonical envelope binds timestamp, message ID, owner ID, method, path, and exact request body.

Knowledge contributions are tagged `originGalaxy=ZILLION` and `ownerUserId=<verified owner>`. Retrieval is restricted to that same origin and owner unless separately authorized by ZCOS.

## PROSPER Dock contract

Exactly five controls are visible in this order:

1. Chat
2. Upload
3. Budget
4. Trade
5. Invest

Chat uses the same ZAR identity while retaining `galaxy=ZILLION` and `desk=CAPITAL` context.

Upload uses the canonical ZCOS intake. Upload does not automatically promote material to trusted Knowledge or Memory.

Budget opens the ZILLION budgeting system.

Trade expands in the Dock interaction to expose only:

`LIVE | SIMULATION`

Invest opens the ZILLION investing workspace and consumes verified holdings from an authorized source. If no holdings source exists, ZAR asks the user to connect a brokerage account or provide a statement through Upload instead of presenting invented data.

## Trading product boundary

The user-facing trading process is intentionally simpler than the internal trading architecture.

Primary environments:

- **Simulation** — isolated simulated capital.
- **Live** — real capital only.

Internal learning, strategy, sandbox, external-paper, evaluation, qualification, governance, validation, provider, and certification systems remain backend capabilities or diagnostics rather than primary user navigation.

Shared Trading Intelligence may support both environments where appropriate, including market data, market structure, research, knowledge, strategy/thesis, risk, governance, backtesting, alerts, and learning.

Simulation and Live must retain separate balances, orders, positions, transactions, P/L, provider provenance, and execution-environment provenance. No Simulation action may cross silently into Live execution.

## Live prerequisite flow

Live is a complete prerequisite-driven workspace rather than a blocked landing page.

ZAR checks the owner context and then asks only for what is missing:

1. Production broker connection.
2. Provider-required account credentials or OAuth/access token material.
3. Account selection when more than one account exists.
4. Current market-data access when a quote is required.
5. Qualification or testing evidence required by Trading Governance.
6. Armed risk controls.
7. Explicit production certification setting.
8. Explicit user confirmation of the exact order.

Webull account data uses the provider's account-list, account-position, account-balance, and order-history APIs when the connected credential has the required access token. Tradovate remains available for supported futures execution.

A missing prerequisite is a request for user/operator input, not a fake success state.

## Investing

Invest uses verified brokerage holdings. The first supported direct holdings source is Webull account positions. ZAR may also request a statement through the canonical Upload path when the user needs another source.

Investing never fabricates holdings, balances, cost basis, gains/losses, or transaction history.

## Authentication

- ZCOS issues 90-second `launch` or `capability` grants.
- A launch grant is single-use and exchanges for an eight-hour HttpOnly ZILLION session.
- A capability grant is single-use and authorizes one ZAR-to-ZILLION API request.
- Default, anonymous, fallback, and malformed owners are rejected.
- ZILLION-to-ZCOS messages are HMAC signed and replay protected by ZCOS.

## Data authority

`trading_state` and `budget_state` are canonical in the ZILLION database. `capital_migration_batches` records controlled state imports. ZAR must not continue as a Finance or Trading writer after cutover.

Provider holdings remain provider-authoritative observations unless and until a dedicated canonical portfolio record is introduced. Any future canonical portfolio state belongs to ZILLION rather than being duplicated into ZAR.

## Execution certification

Research, Simulation, broker connectivity, account inspection, order preparation, and governed approvals are implemented independently from the final production-execution certification.

Live execution is fail-closed by default through `ZILLION_LIVE_TRADING_CERTIFIED=false`. The code path is not permanently disabled: an operator may set the value to `true` only after the deployment/security certification has been completed. Production broker connectivity, qualification, risk controls, and explicit order confirmation remain separate gates even after certification is enabled.

Startup does not activate an autonomous live-trade scheduler.

The Live UI must never represent simulated, demo, rejected, unsubmitted, or otherwise non-real execution as Live.