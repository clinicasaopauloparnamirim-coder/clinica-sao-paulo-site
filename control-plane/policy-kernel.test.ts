import { strict as assert } from "node:assert";
import { authorizeGoogleAdsMutation } from "./policy-kernel";

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
assert.equal(
  authorizeGoogleAdsMutation(
    "campaigns",
    [{ resourceName: "customers/4603647788/campaigns/24146336625" }],
    true,
    false,
  ).allowed,
  false,
);
assert.equal(
  authorizeGoogleAdsMutation(
    "campaigns",
    [{ resourceName: "customers/4603647788/campaigns/24146336625" }],
    false,
    true,
  ).allowed,
  false,
);
assert.equal(
  authorizeGoogleAdsMutation(
    "campaigns",
    [{ resourceName: "customers/4603647788/campaigns/123" }],
    false,
    false,
  ).allowed,
  false,
);
assert.equal(
  authorizeGoogleAdsMutation(
    "campaigns",
    [{ resourceName: "customers/4603647788/campaigns/123" }],
    true,
    false,
  ).allowed,
  true,
);

console.log("policy-kernel checks passed");
