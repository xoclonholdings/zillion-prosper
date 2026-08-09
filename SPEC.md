# ZILLION Prosper System Boundary

## Canonical ownership

ZILLION owns all runtime code and durable state for:

- Budgeting and treasury allocation
- Investing and market research
- Trading education and assessments
- Strategy, thesis, scanner, backtest, validation, and paper-trading systems
- Broker and market-data connections
- Trading progression, journals, performance, qualification, and governance

ZAR does not own or write these domains. It may classify a Finance intent, launch this application, or invoke the Capital agent through a ZCOS-issued typed capability.

Capital-specific seed templates travel with this domain implementation. ZYLO
Automate remains the authority for registered cross-galaxy workflows and may
invoke ZILLION through the typed Capital capability.

## Shared ZCOS authorities

Identity, global memory, shared knowledge, model access, web search, approvals, and audit remain ZCOS authorities. ZILLION accesses them only through signed calls whose canonical envelope binds timestamp, message ID, owner ID, method, path, and exact request body.

Knowledge contributions are tagged `originGalaxy=ZILLION` and `ownerUserId=<verified owner>`. Retrieval is restricted to that same origin and owner.

## Authentication

- ZCOS issues 90-second `launch` or `capability` grants.
- A launch grant is single-use and exchanges for an eight-hour HttpOnly ZILLION session.
- A capability grant is single-use and authorizes one ZAR-to-ZILLION API request.
- Default, anonymous, fallback, and malformed owners are rejected.
- ZILLION-to-ZCOS messages are HMAC signed and replay protected by ZCOS.

## Data authority

`trading_state` and `budget_state` are canonical in the ZILLION database. `capital_migration_batches` records controlled state imports. ZAR must not continue as a Finance or Trading writer after cutover.

## Execution certification

Research, simulation, paper trading, and governed approvals are supported. Live trading is not certified. The certification constant is hard-coded false, execution routes reject live orders, and startup does not activate an autonomous trade scheduler.
