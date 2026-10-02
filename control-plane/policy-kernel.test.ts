import { strict as assert } from "node:assert";
import {
  authorizeGoogleAdsMutation,
  extractCampaignIdsFromOperations,
  getCampaignScope,
} from "./policy-kernel.ts";

const activeCampaign = "customers/4603647788/campaigns/24289443969";
const retiredCampaign = "customers/4603647788/campaigns/24146336625";
const unknownCampaign = "customers/4603647788/campaigns/99999999999";

function assertDeniedCode(decision: ReturnType<typeof authorizeGoogleAdsMutation>, expected: string) {
  assert.equal(decision.allowed, false);
  if (decision.allowed) return;
  assert.equal(decision.code, expected);
}

assert.equal(authorizeGoogleAdsMutation("campaignBudgets", [{}], false, true).allowed, false);
assert.equal(
  authorizeGoogleAdsMutation(
    "campaigns",
    [{ campaignBudgetOperation: { resourceName: "customers/4603647788/campaignBudgets/123" } }],
    false,
    true,
  ).allowed,
  false,
);

assert.equal(getCampaignScope("24289443969"), "active");
assert.equal(getCampaignScope("24146336625"), "retired");
assert.equal(getCampaignScope("99999999999"), null);

assert.deepEqual(
  extractCampaignIdsFromOperations([{ resourceName: activeCampaign }, { resourceName: retiredCampaign }]),
  ["24289443969", "24146336625"],
);

assertDeniedCode(
  authorizeGoogleAdsMutation("campaigns", [{ resourceName: retiredCampaign }], true, false),
  "CAMPAIGN_RETIRED",
);

assertDeniedCode(
  authorizeGoogleAdsMutation("campaigns", [{ resourceName: retiredCampaign }], false, true),
  "CAMPAIGN_RETIRED",
);

assertDeniedCode(
  authorizeGoogleAdsMutation("campaigns", [{ resourceName: unknownCampaign }], true, false),
  "CAMPAIGN_OUT_OF_SCOPE",
);

assertDeniedCode(
  authorizeGoogleAdsMutation("campaigns", [{ resourceName: activeCampaign }], false, false),
  "EXPLICIT_CONFIRMATION_REQUIRED",
);

assert.equal(
  authorizeGoogleAdsMutation("campaigns", [{ resourceName: activeCampaign }], false, true).allowed,
  true,
);

assert.equal(
  authorizeGoogleAdsMutation("campaigns", [{ resourceName: activeCampaign }], true, false).allowed,
  true,
);

assert.equal(authorizeGoogleAdsMutation("campaigns", [{}], false, true).allowed, true);

assertDeniedCode(
  authorizeGoogleAdsMutation("campaigns", Array.from({ length: 101 }, () => ({})), true, false),
  "MUTATION_TOO_LARGE",
);

console.log("policy-kernel checks passed");
