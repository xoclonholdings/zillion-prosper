import { invokeZcosCapability } from "../ZcosCapabilityClient";

export interface AgentApprovalInput {
  user_id: string;
  conversation_id?: string | null;
  message: string;
  draft: string;
  agent: "FinanceAgent";
  capabilities?: string[];
}

export interface AgentApprovalResult {
  task_id: string;
  approval_status?: string;
  approval_role?: "user" | "admin" | "system" | null;
}

export class AgentApprovalAdapter {
  static register(input: AgentApprovalInput): Promise<AgentApprovalResult> {
    return invokeZcosCapability("/api/capabilities/approvals", {
      body: { ...input, capability: "zillion.capital.approval.request" },
    });
  }
}
