# ZAR → ZILLION Prosper migration manifest

- Source repository: `xoclonholdings/ZedAI`
- Source baseline: `db1455ec81be49fc27c2d8274b74310f6c5eac3a`
- Target repository: `xoclonholdings/zillion-prosper`
- Target domain: ZILLION Prosper → Capital
- Schema version: `capital-v1`

## Code moved

- Budget UI, contracts, allocation logic, state, deposits, and reporting
- Trading UI, contracts, curriculum, stage progression, and assessment
- Market data, market structure, scanner, thesis, backtest, and evaluation
- Paper trading, external paper providers, reviews, incidents, and governance
- Broker and market-data connection stores and execution adapters
- Finance agent implementation and Capital-specific Finance/Trading seed templates

The Capital-specific seed templates moved with their domain implementation.
Cross-galaxy workflow authority remains ZYLO Automate; when those templates are
registered as reusable workflows, ZYLO invokes ZILLION through the typed
Capital capability.

ZAR retains only compatibility routes, an owner-bound launch/capability
gateway, shared model/search/knowledge services, and approval authority.

## State authority

- `trading_state` is authoritative in the Prosper PostgreSQL database.
- `budget_state` is authoritative in the Prosper PostgreSQL database.
- `capital_migration_batches` records migration identity, source commit,
  counts, checksum, actor, and outcome.
- JSON storage is a local-development fallback only.
- Owner IDs, timestamps, provider labels, and history must be preserved.

## Cutover checks

1. Put legacy ZAR Finance/Trading writers behind the deployed Prosper gateway.
2. Record the migration batch as `running` in the target database.
3. Copy legacy records without changing owner IDs or history.
4. Compare per-scope counts and a canonical SHA-256 checksum.
5. Exercise budget, progression, paper-trade, and connection reads as each
   affected owner.
6. Mark the batch `verified`; retain the ZAR records read-only for rollback.
7. Keep live trading blocked pending its independent certification.

The repository migration intentionally does not drop legacy production tables
or claim that production records were copied. Those steps require deployment
database access and an auditable operator.
