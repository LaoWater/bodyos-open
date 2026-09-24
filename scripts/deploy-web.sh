#!/usr/bin/env bash
# Run in Google Cloud Shell: bash scripts/deploy-web.sh PROJECT_ID
set -euo pipefail

if [[ $# != 1 || ! $1 =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
  echo "Usage: bash scripts/deploy-web.sh PROJECT_ID" >&2
  exit 2
fi
project="$1"
command -v gcloud >/dev/null
command -v git >/dev/null
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit or set aside local changes before deploying this checkout." >&2
  exit 1
fi
commit="$(git rev-parse HEAD)"
account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)')"
if [[ -z "$account" ]]; then
  echo "Sign in to Google Cloud before deploying." >&2
  exit 1
fi
echo "Account: $account"
echo "Project: $project | Source commit: $commit"
gcloud app describe --project="$project" --format='table(id,locationId,defaultHostname)'
echo "Current traffic (unchanged by this script):"
gcloud app services describe default --project="$project" --format='json(split.allocations)'

# Existing App Engine app and billing are prerequisites; no IAM grants are made here.
gcloud services enable appengine.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project="$project"
version="community-${commit:0:8}-$(date -u +%Y%m%d%H%M%S)"
gcloud builds submit . --project="$project" --config=cloudbuild.web.yaml \
  --ignore-file=.gcloudignore --substitutions="_VERSION=$version"

echo "Preview deployed. Live traffic has not been changed."
gcloud app versions describe "$version" --service=default --project="$project" --format='value(versionUrl)'
echo "After reviewing that preview, publish it with:"
echo "gcloud app services set-traffic default --splits=$version=1 --project=$project"
