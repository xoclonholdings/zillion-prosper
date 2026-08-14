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

## Canonical ownership

ZILLION owns all runtime code and durable state for:

- Budgeting and treasury allocation
- Investing domain state and market research
- Trading education and assessments
- Strategy, thesis, scanner, backtest, validation, and paper-trading systems
- Broker and market-data connections
- Trading progression, journals, performance, qualification, and governance

Ownership does not imply that every external provider is already connected. Investing holdings and Live execution must report their real implementation state and may not fabricate balances, positions, transactions, provider connectivity, or certification.

ZAR does not own or write these domains. It may classify a Finance intent, launch ZILLION, operate Chat in ZILLION/CAPITAL context, or invoke the Capital agent through a ZCOS-issued typed capability.

Capital-specific seed templates travel with this domain implementation. ZYLO Automate remains the authority for registered cross-galaxy workflows and may invoke ZILLION through the typed Capital capability.

## Shared ZCOS authorities

Identity, global Memory, shared Knowledge, Apps/Extensions, Settings, Portal transport, model access, web search, approvals, and audit remain ZCOS authorities.

ZILLION presents the seven shared domains in its galaxy but does not duplicate their canonical records.

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

Invest opens the ZILLION investing surface and must truthfully report when a canonical holdings/portfolio source is not yet connected.

## Trading product boundary

The user-facing trading process is intentionally simpler than the internal trading architecture.

Primary environments:

- **Simulation** — isolated simulated capital.
- **Live** — real capital only.

Internal learning, strategy, sandbox, external-paper, evaluation, qualification, governance, validation, provider, and certification systems remain backend capabilities or diagnostics rather than primary user navigation.

Shared Trading Intelligence may support both environments where appropriate, including market data, market structure, research, knowledge, strategy/thesis, risk, governance, backtesting, alerts, and learning.

Simulation and Live must retain separate balances, orders, positions, transactions, P/L, provider provenance, and execution-environment provenance. No Simulation action may cross silently into Live execution.

## Authentication

- ZCOS issues 90-second `launch` or `capability` grants.
- A launch grant is single-use and exchanges for an eight-hour HttpOnly ZILLION session.
- A capability grant is single-use and authorizes one ZAR-to-ZILLION API request.
- Default, anonymous, fallback, and malformed owners are rejected.
- ZILLION-to-ZCOS messages are HMAC signed and replay protected by ZCOS.

## Data authority

`trading_state` and `budget_state` are canonical in the ZILLION database. `capital_migration_batches` records controlled state imports. ZAR must not continue as a Finance or Trading writer after cutover.

Any future canonical portfolio/holdings state must also belong to ZILLION rather than being duplicated into ZAR.

## Execution certification

Research, simulation, paper trading, and governed approvals are supported. Live trading is not certified.

The certification constant is hard-coded false, execution routes reject uncertified live orders, and startup does not activate an autonomous trade scheduler.

The Live UI may exist and show readiness state, but it must never represent simulated, demo, rejected, unsubmitted, or otherwise non-real execution as Live.
