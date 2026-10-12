# Google Cloud CLI from GitHub Actions

The workflow `.github/workflows/google-cloud-cli-check.yml` authenticates with Workload Identity Federation (WIF), not a long-lived service-account JSON key.

## Required GitHub repository variables

Add these under **Settings → Secrets and variables → Actions → Variables**:
- `GCP_PROJECT_ID`: Google Cloud project ID.
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: full provider resource name: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`.
- `GCP_SERVICE_ACCOUNT`: service-account email, e.g. `name@PROJECT_ID.iam.gserviceaccount.com`.

These identifiers are not credentials. Do not put private keys or access tokens in repository variables.

## Google Cloud setup (run in Google Cloud Shell)

Replace every uppercase placeholder before running. You need permission to manage Workload Identity Federation and service-account IAM.

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REPO_OWNER="clinicasaopauloparnamirim-coder"
export REPO_NAME="clinica-sao-paulo-site"
export POOL_ID="github-actions"
export PROVIDER_ID="github-provider"
export SA_NAME="github-gcloud-check"

gcloud config set project "$PROJECT_ID"
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project="$PROJECT_ID"

gcloud iam workload-identity-pools create "$POOL_ID" --project="$PROJECT_ID" --location="global" --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" --project="$PROJECT_ID" --location="global" --workload-identity-pool="$POOL_ID" --display-name="GitHub repository provider" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" --attribute-condition="assertion.repository == '${REPO_OWNER}/${REPO_NAME}'"

gcloud iam service-accounts create "$SA_NAME" --project="$PROJECT_ID" --display-name="GitHub gcloud connectivity check"

export SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
export PROVIDER_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" --project="$PROJECT_ID" --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${REPO_OWNER}/${REPO_NAME}"

gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="roles/browser"

printf 'GCP_PROJECT_ID=%s\nGCP_WORKLOAD_IDENTITY_PROVIDER=%s\nGCP_SERVICE_ACCOUNT=%s\n' "$PROJECT_ID" "$PROVIDER_RESOURCE" "$SA_EMAIL"
```

The commands create cloud resources and change IAM policy. Review project and placeholders before running. If resources already exist, inspect them rather than blindly recreating them.

## Run verification

1. Add the three output values as GitHub repository variables.
2. Open [the workflow](https://github.com/clinicasaopauloparnamirim-coder/clinica-sao-paulo-site/actions/workflows/google-cloud-cli-check.yml).
3. Choose **Run workflow** on branch `main`.
4. Confirm authentication and `gcloud projects describe` succeed.

A successful run proves GitHub Actions can federate to the service account and view the project. It does not grant access to Google Ads, Analytics, Search Console, Business Profile APIs, or deployment operations; add those permissions separately only if needed.