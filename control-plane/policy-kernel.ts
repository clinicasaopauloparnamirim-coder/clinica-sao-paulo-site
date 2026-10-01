export type MutationResource =
  | "campaignBudgets"
  | "campaigns"
  | "adGroups"
  | "adGroupCriteria"
  | "adGroupAds"
  | "campaignCriteria"
  | "userLists"
  | "remarketingActions";

export type CampaignScope = "active" | "retired";

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; code: string; reason: string };

export const OPERATIONAL_CAMPAIGNS: Readonly<Record<string, CampaignScope>> = Object.freeze({
  "24289443969": "active",
});

export const RETIRED_CAMPAIGNS: Readonly<Record<string, CampaignScope>> = Object.freeze({
  "24146336625": "retired",
});

export function getCampaignScope(campaignId: string): CampaignScope | null {
  if (Object.prototype.hasOwnProperty.call(RETIRED_CAMPAIGNS, campaignId)) return "retired";
  if (Object.prototype.hasOwnProperty.call(OPERATIONAL_CAMPAIGNS, campaignId)) return "active";
  return null;
}

export function extractCampaignIdsFromOperations(operations: unknown[]): string[] {
  const payload = JSON.stringify(operations);
  const found = new Set<string>();
  const pattern = /customers\/\d+\/campaigns\/(\d+)/g;
  for (const match of payload.matchAll(pattern)) {
    found.add(match[1]);
  }
  return [...found];
}

function serializedOperations(operations: unknown[]) {
  return JSON.stringify(operations).toLowerCase();
}

function containsBudgetMutation(resource: MutationResource, operations: unknown[]) {
  if (resource === "campaignBudgets") return true;
  const payload = serializedOperations(operations);
  return payload.includes("campaignbudget") || payload.includes("campaign_budget") || payload.includes("campaign budget");
}

export function authorizeGoogleAdsMutation(
  resource: MutationResource,
  operations: unknown[],
  validateOnly: boolean,
  confirm: boolean,
): PolicyDecision {
  if (!Array.isArray(operations) || operations.length === 0) {
    return { allowed: false, code: "EMPTY_MUTATION", reason: "At least one mutation operation is required." };
  }

  if (operations.length > 100) {
    return { allowed: false, code: "MUTATION_TOO_LARGE", reason: "A mutation batch may contain at most 100 operations." };
  }

  if (containsBudgetMutation(resource, operations)) {
    return {
      allowed: false,
      code: "FINANCIAL_ACTION_BLOCKED",
      reason: "Control Tower policy blocks campaign budget mutations. Budget/payment changes require a separate explicitly authorized workflow.",
    };
  }

  for (const campaignId of extractCampaignIdsFromOperations(operations)) {
    const scope = getCampaignScope(campaignId);
    if (scope === "retired") {
      return {
        allowed: false,
        code: "CAMPAIGN_RETIRED",
        reason: `Campaign ${campaignId} is retired and permanently outside the operational Control Tower scope.`,
      };
    }
    if (scope !== "active") {
      return {
        allowed: false,
        code: "CAMPAIGN_OUT_OF_SCOPE",
        reason: `Campaign ${campaignId} is not registered in the active operational scope.`,
      };
    }
  }

  if (!validateOnly && confirm !== true) {
    return {
      allowed: false,
      code: "EXPLICIT_CONFIRMATION_REQUIRED",
      reason: "Live Google Ads mutations require explicit confirmation.",
    };
  }

  return { allowed: true };
}
