export type MutationResource =
  | "campaignBudgets"
  | "campaigns"
  | "adGroups"
  | "adGroupCriteria"
  | "adGroupAds"
  | "campaignCriteria"
  | "userLists"
  | "remarketingActions";

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; code: string; reason: string };

const SEARCH_2_ID = "24146336625";
const SEARCH_2_NAME = "search-2";

function serializedOperations(operations: unknown[]) {
  return JSON.stringify(operations).toLowerCase();
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

  if (resource === "campaignBudgets") {
    return {
      allowed: false,
      code: "FINANCIAL_ACTION_BLOCKED",
      reason: "Control Tower policy blocks campaign budget mutations. Budget/payment changes require a separate explicitly authorized workflow.",
    };
  }

  const payload = serializedOperations(operations);
  if (payload.includes(SEARCH_2_ID) || payload.includes(SEARCH_2_NAME)) {
    return {
      allowed: false,
      code: "SEARCH_2_PROTECTED",
      reason: "Google Ads campaign Search-2 is protected by project policy and is outside the current mutation scope.",
    };
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
