# Deploying Metis to Google Cloud Run

## Architecture

Single container: Express serves both the `/api/*` routes and the compiled React SPA.

```
Browser → Cloud Run (Express :8080)
              ├── /api/*   → route handlers + SQLite (ephemeral)
              └── /*       → dist/index.html (React SPA)
```

> **Note on SQLite**: Cloud Run instances are stateless. The SQLite DB persists
> only for the lifetime of a container instance. For production persistence,
> replace SQLite with Cloud SQL (Postgres) or Firestore.

---

## One-time GCP setup

### 1. Enable APIs
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com
```

### 2. Create the Artifact Registry repository
```bash
gcloud artifacts repositories create metis \
  --repository-format=docker \
  --location=australia-southeast1 \
  --description="Metis threat modeler Docker images"
```

### 3. Create secrets in Secret Manager
```bash
# Anthropic API key
echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-

# JWT secret (generate a strong random string)
openssl rand -hex 32 | gcloud secrets create jwt-secret --data-file=-
```

### 4. Create a dedicated service account
```bash
gcloud iam service-accounts create metis-deployer \
  --display-name "Metis Cloud Run deployer"

SA="metis-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member "serviceAccount:$SA" --role roles/run.admin
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member "serviceAccount:$SA" --role roles/storage.admin
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member "serviceAccount:$SA" --role roles/secretmanager.secretAccessor
```

### 4b. Grant the Cloud Run runtime service account Firestore access

The *runtime* identity is the **default compute service account**, not the deployer SA above.
Firebase Admin (org membership checks, RAG) uses ADC at runtime and needs Firestore read/write.

```bash
# Cloud Run runtime identity
RUNTIME_SA="499037545252-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding metis-ai-1551 \
  --member "serviceAccount:$RUNTIME_SA" \
  --role roles/datastore.user

# Also grant Firebase Admin SDK access (token verification, custom claims)
gcloud projects add-iam-policy-binding metis-ai-1551 \
  --member "serviceAccount:$RUNTIME_SA" \
  --role roles/firebase.sdkAdminServiceAgent
```

> If you already deployed and are seeing "Failed to verify org membership" errors,
> run the two `add-iam-policy-binding` commands above — no redeploy needed,
> IAM changes take effect within ~60 seconds.

### 5. Set up Workload Identity Federation (no long-lived keys)
```bash
# Create the pool
gcloud iam workload-identity-pools create github-pool \
  --location global --display-name "GitHub Actions"

# Create the provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location global \
  --workload-identity-pool github-pool \
  --display-name "GitHub" \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri "https://token.actions.githubusercontent.com"

# Bind to the service account
POOL_ID=$(gcloud iam workload-identity-pools describe github-pool \
  --location global --format "value(name)")

gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO"
```

---

## GitHub Secrets required

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider resource name from step 4 |
| `GCP_SERVICE_ACCOUNT` | `metis-deployer@PROJECT_ID.iam.gserviceaccount.com` |

---

## Local Docker test

```bash
cd threat-modeler

# Build
docker build -t metis-local .

# Run (pass secrets via env)
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e JWT_SECRET=dev-secret \
  metis-local

# Open http://localhost:8080
```

---

## Deploy manually (without CI)

```bash
cd threat-modeler

PROJECT=YOUR_PROJECT_ID
IMAGE=gcr.io/$PROJECT/metis-threat-modeler

docker build -t $IMAGE .
docker push $IMAGE

gcloud run deploy metis-threat-modeler \
  --image $IMAGE \
  --region australia-southeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-secrets "ANTHROPIC_API_KEY=anthropic-api-key:latest,JWT_SECRET=jwt-secret:latest" \
  --set-env-vars "NODE_ENV=production"
```
