import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessLead,
  canAccessProject,
  canAccessRAB,
  UnauthorizedError,
  apiError,
} from "../../lib/rbac/guard";

test("project access is constrained by role scope", () => {
  assert.equal(canAccessProject("SUPER_ADMIN", null, "branch-b", false, false), true);
  assert.equal(canAccessProject("BRANCH_MANAGER", "branch-a", "branch-b", false, false), false);
  assert.equal(canAccessProject("BRANCH_MANAGER", "branch-a", "branch-a", false, false), true);
  assert.equal(canAccessProject("PROJECT_MANAGER", "branch-a", "branch-a", false, false), false);
  assert.equal(canAccessProject("PROJECT_MANAGER", "branch-a", "branch-b", true, false), true);
  assert.equal(canAccessProject("CLIENT", null, "branch-a", false, false), false);
  assert.equal(canAccessProject("CLIENT", null, "branch-a", false, true), true);
});

test("field roles missing from the old policy use project membership", () => {
  for (const role of ["MANDOR", "SURVEYOR", "LOGISTIK"] as const) {
    assert.equal(canAccessProject(role, "branch-a", "branch-a", false, false), false);
    assert.equal(canAccessProject(role, "branch-a", "branch-b", true, false), true);
  }
});

test("lead access matches global, branch, estimator, and assignment scopes", () => {
  assert.equal(canAccessLead("OWNER", "owner", null, "branch-b", null), true);
  assert.equal(canAccessLead("BRANCH_MANAGER", "bm", "branch-a", "branch-b", null), false);
  assert.equal(canAccessLead("BRANCH_MANAGER", "bm", "branch-a", "branch-a", null), true);
  assert.equal(canAccessLead("ESTIMATOR", "est", "branch-a", null, null), true);
  assert.equal(canAccessLead("PROJECT_MANAGER", "pm-a", "branch-a", "branch-b", "pm-b"), false);
  assert.equal(canAccessLead("PROJECT_MANAGER", "pm-a", "branch-a", "branch-b", "pm-a"), true);
});

test("RAB access follows the lead branch", () => {
  assert.equal(canAccessRAB("OWNER", null, "branch-b"), true);
  assert.equal(canAccessRAB("BRANCH_MANAGER", "branch-a", "branch-a"), true);
  assert.equal(canAccessRAB("PROJECT_MANAGER", "branch-a", "branch-b"), false);
  assert.equal(canAccessRAB("ESTIMATOR", null, null), false);
});

test("unauthenticated API errors return 401 instead of 500", async () => {
  const response = apiError(new UnauthorizedError());
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "Unauthorized");
});
