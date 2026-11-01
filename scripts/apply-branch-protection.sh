#!/usr/bin/env bash
# Apply the "master protection" ruleset and rebase-only merge settings.
# Usage: ./scripts/apply-branch-protection.sh
# Exits 3 if rulesets are unavailable (private repo without GitHub Pro).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
RULESET_NAME="master protection"
RULESET_FILE=".github/rulesets/master.json"
PLAN_ERROR="Upgrade to GitHub Pro or make this repository public"

api() {
  local output
  if ! output=$(gh api "$@" 2>&1); then
    if [[ "$output" == *"$PLAN_ERROR"* ]]; then
      echo "Merge settings applied; rulesets need a public repo or GitHub Pro." >&2
      echo "Re-run after making the repository public." >&2
      exit 3
    fi
    printf '%s\n' "$output" >&2
    exit 1
  fi
  printf '%s\n' "$output"
}

gh api -X PATCH "repos/$REPO" \
  -F allow_merge_commit=false \
  -F allow_squash_merge=false \
  -F allow_rebase_merge=true \
  -F delete_branch_on_merge=true \
  --silent

EXISTING_ID=$(api "repos/$REPO/rulesets" \
  --jq ".[] | select(.name == \"$RULESET_NAME\") | .id" | head -n 1)

if [ -n "$EXISTING_ID" ]; then
  echo "Updating ruleset \"$RULESET_NAME\" (id $EXISTING_ID)"
  api -X PUT "repos/$REPO/rulesets/$EXISTING_ID" --input "$RULESET_FILE" --silent
else
  echo "Creating ruleset \"$RULESET_NAME\""
  api -X POST "repos/$REPO/rulesets" --input "$RULESET_FILE" --silent
fi

echo "Done. Verify with: gh api repos/$REPO/rulesets"
