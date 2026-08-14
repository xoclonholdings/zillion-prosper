import type { ExecutionAccountSummary } from "./ExecutionAdapterTypes";
import { TradingIntegrationsStore } from "./TradingIntegrationsStore";
import { getWebullStatus } from "./WebullAuth";
import {
  WEBULL_PROVIDER,
  explainWebullAuthFailure,
  getWebullConnection,
  resolveActiveWebullCredential,
  resolvedValue,
  webullCredentialCandidates,
  webullFetch,
  type WebullCredentialCandidate,
} from "./WebullShared";

/** GET /openapi/account/list (v2) — confirmed against Webull's Trading API. */
const ACCOUNT_LIST_PATH = "/openapi/account/list";
const ACCOUNT_BALANCE_PATH = "/openapi/assets/balance";
const ACCOUNT_POSITIONS_PATH = "/openapi/assets/positions";
const ORDER_HISTORY_PATH = "/openapi/trade/order/history";

function parseAccounts(data: any): ExecutionAccountSummary[] {
  const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return raw.map((a: any, i: number) => ({
    id: String(a?.account_id ?? a?.accountId ?? a?.id ?? `account-${i + 1}`),
    label: String(a?.account_type ?? a?.accountType ?? a?.type ?? "Webull account"),
    type: String(a?.account_type ?? a?.accountType ?? a?.type ?? "unknown"),
    raw: a,
  }));
}

function flattenOrders(data: any): unknown[] {
  const groups = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  const out: unknown[] = [];
  for (const group of groups) {
    if (Array.isArray(group?.orders)) out.push(...group.orders);
    else if (group) out.push(group);
  }
  return out;
}

async function fetchAccountList(
  candidate: WebullCredentialCandidate,
): Promise<{ ok: boolean; accounts: ExecutionAccountSummary[]; message: string }> {
  const result = await webullFetch({
    host: candidate.endpoint,
    path: ACCOUNT_LIST_PATH,
    appKey: candidate.appKey,
    appSecret: candidate.appSecret,
  });
  if (result.error) {
    return { ok: false, accounts: [], message: `Could not reach ${candidate.endpoint}: ${result.error}` };
  }
  if (!result.ok) {
    return {
      ok: false,
      accounts: [],
      message: explainWebullAuthFailure(
        `HTTP ${result.status}: ${result.text.slice(0, 300)}`,
        candidate.endpoint,
      ),
    };
  }
  const accounts = parseAccounts(result.data);
  return {
    ok: true,
    accounts,
    message: `${accounts.length} account(s) returned from ${candidate.endpoint}.`,
  };
}

/**
 * Test the Webull connection: try every credential/endpoint candidate,
 * reconcile the saved account id against Webull's live list, and persist the
 * credential source/endpoint that actually verified.
 */
export async function testWebullConnection(userId: string): Promise<{
  ok: boolean;
  endpoint?: string;
  accountCount?: number;
  selectedAccountId?: string;
  accounts: ExecutionAccountSummary[];
  message: string;
}> {
  const connection = await getWebullConnection(userId);
  const credentials = webullCredentialCandidates(connection);
  if (!credentials.length) {
    return {
      ok: false,
      accounts: [],
      message: "Missing WEBULL_APP_KEY or WEBULL_APP_SECRET on the server, and no saved Webull credentials exist.",
    };
  }

  const savedAccountId = connection?.fields?.accountId || "";
  const failures: string[] = [];
  for (const candidate of credentials) {
    const result = await fetchAccountList(candidate);
    if (!result.ok) {
      failures.push(`${candidate.source} on ${candidate.endpoint}: ${result.message}`);
      continue;
    }
    const liveIds = result.accounts.map((account) => account.id);
    const selectedAccountId =
      savedAccountId && liveIds.includes(savedAccountId) ? savedAccountId : result.accounts[0]?.id;

    const fieldsToSave: Record<string, string> = {
      endpoint: candidate.endpoint,
      environment: candidate.mode,
      credentialSource: candidate.source,
    };
    if (selectedAccountId && selectedAccountId !== savedAccountId) fieldsToSave.accountId = selectedAccountId;
    const changed =
      connection?.fields?.endpoint !== fieldsToSave.endpoint ||
      connection?.fields?.environment !== fieldsToSave.environment ||
      connection?.fields?.credentialSource !== fieldsToSave.credentialSource ||
      Boolean(fieldsToSave.accountId);
    if (changed) await TradingIntegrationsStore.connect({ userId, provider: WEBULL_PROVIDER, fields: fieldsToSave });

    return {
      ok: true,
      endpoint: candidate.endpoint,
      accountCount: result.accounts.length,
      selectedAccountId,
      accounts: result.accounts,
      message: selectedAccountId
        ? `Webull account-list succeeded using ${candidate.source} on ${candidate.endpoint}. Account ${selectedAccountId} is selected.`
        : `Webull account-list succeeded using ${candidate.source} on ${candidate.endpoint}, but Webull returned no accounts. Add the account ID manually.`,
    };
  }
  return {
    ok: false,
    accountCount: 0,
    accounts: [],
    message: `Webull account-list failed for every credential source. ${failures.join(" | ")}`,
  };
}

/** Live accounts Webull actually reports (not a cached/saved value). */
export async function listWebullAccounts(userId: string): Promise<{
  connected: boolean;
  accounts: ExecutionAccountSummary[];
  note: string;
}> {
  const connection = await getWebullConnection(userId);
  const credentials = webullCredentialCandidates(connection);
  for (const candidate of credentials) {
    const result = await fetchAccountList(candidate);
    if (result.ok) return { connected: true, accounts: result.accounts, note: result.message };
  }
  const status = await getWebullStatus(userId);
  return { connected: status.connected, accounts: status.accounts, note: status.note };
}

async function authenticatedAccountRequest(userId: string, path: string, extraQuery: Record<string, string> = {}) {
  const connection = await getWebullConnection(userId);
  const candidate = resolveActiveWebullCredential(connection);
  const accountId = resolvedValue(connection, "accountId", "WEBULL_ACCOUNT_ID");
  const accessToken = resolvedValue(connection, "accessToken", "WEBULL_ACCESS_TOKEN");
  if (!candidate) return { ok: false as const, note: "ZAR needs your Webull App Key and App Secret.", data: null };
  if (!accountId) return { ok: false as const, note: "ZAR needs a Webull account ID. Run the connection test first.", data: null };
  if (!accessToken) return { ok: false as const, note: "ZAR needs the Webull access token for account data.", data: null };

  const result = await webullFetch({
    host: candidate.endpoint,
    path,
    appKey: candidate.appKey,
    appSecret: candidate.appSecret,
    query: { account_id: accountId, ...extraQuery },
    extraHeaders: { "x-access-token": accessToken, "x-version": "v2" },
  });
  if (!result.ok) {
    return {
      ok: false as const,
      note: result.error || explainWebullAuthFailure(`HTTP ${result.status}: ${result.text.slice(0, 300)}`, candidate.endpoint),
      data: null,
    };
  }
  return { ok: true as const, note: `Webull returned live account data for ${accountId}.`, data: result.data };
}

/** Current account balance/buying-power data from Webull. */
export async function getWebullBalance(userId: string): Promise<{
  connected: boolean;
  balance: unknown | null;
  note: string;
}> {
  const result = await authenticatedAccountRequest(userId, ACCOUNT_BALANCE_PATH);
  return { connected: result.ok, balance: result.data, note: result.note };
}

/** Current holdings/positions from Webull's official Account Positions endpoint. */
export async function listWebullPositions(userId: string): Promise<{
  connected: boolean;
  positions: unknown[];
  note: string;
}> {
  const result = await authenticatedAccountRequest(userId, ACCOUNT_POSITIONS_PATH);
  if (!result.ok) return { connected: false, positions: [], note: result.note };
  const raw = Array.isArray(result.data) ? result.data : Array.isArray(result.data?.data) ? result.data.data : [];
  return { connected: true, positions: raw, note: result.note };
}

/** Recent broker order history (up to 100 records in the default seven-day window). */
export async function listWebullOrders(userId: string): Promise<{
  connected: boolean;
  orders: unknown[];
  note: string;
}> {
  const result = await authenticatedAccountRequest(userId, ORDER_HISTORY_PATH, { page_size: "100" });
  if (!result.ok) return { connected: false, orders: [], note: result.note };
  return { connected: true, orders: flattenOrders(result.data), note: result.note };
}
