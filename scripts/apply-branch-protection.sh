#!/usr/bin/env bash
#
# Apply the "master protection" repository ruleset and the PR-only merge
# settings. See .github/rulesets/master.json for the rules themselves.
#
# Requirements:
#   - GitHub CLI authenticated with admin access to the repository
#     (`gh auth status`)
#   - The PR Title workflow (.github/workflows/pr-title.yml) must already be on
#     the default branch, otherwise the "Validate PR title" check never reports
#     and merges stay blocked by the required-status rule.
#
# Usage:
#   ./scripts/apply-branch-protection.sh
#
# Safe to re-run: an existing ruleset with the same name is replaced.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
RULESET_NAME="master protection"
RULESET_FILE=".github/rulesets/master.json"

echo "Configuring ${REPO}"

# Rebase merge only; delete the head branch after merging.
gh api -X PATCH "repos/${REPO}" \
  -F allow_merge_commit=false \
  -F allow_squash_merge=false \
  -F allow_rebase_merge=true \
  -F delete_branch_on_merge=true \
  --silent

EXISTING_ID=$(gh api "repos/${REPO}/rulesets" \
  --jq ".[] | select(.name == \"${RULESET_NAME}\") | .id" | head -n 1)

if [ -n "${EXISTING_ID}" ]; then
  echo "Updating ruleset \"${RULESET_NAME}\" (id ${EXISTING_ID})"
  gh api -X PUT "repos/${REPO}/rulesets/${EXISTING_ID}" \
    --input "${RULESET_FILE}" \
    --silent
else
  echo "Creating ruleset \"${RULESET_NAME}\""
  gh api -X POST "repos/${REPO}/rulesets" \
    --input "${RULESET_FILE}" \
    --silent
fi

echo "Done. Verify with: gh api repos/${REPO}/rulesets"
