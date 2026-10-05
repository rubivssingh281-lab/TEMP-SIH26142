# SIH26142 — Complete Project Approach

## Deep Learning Based Super Resolution Mapping (SRM) from Sentinel-2 Imagery

> A full-stack, beginner-friendly walkthrough of how we will build this project end-to-end: frontend, backend, ML pipeline, database, storage, deployment, and demo. Written for a college 2nd-year student — every part is explained in plain language before we get technical.

---

## 1. The Big Picture

We are building a system that takes **medium-resolution satellite images (10 m per pixel)** from the Sentinel-2 satellite and produces **sharper images (<4 m per pixel)** using deep learning, along with an honesty layer (uncertainty map) that tells the user which parts of the sharp image are trustworthy.

Think of it like this:

> A blurry photo of a field → AI processes it → A clearer photo where you can see roads, small buildings, and field boundaries → Plus a heatmap saying "I'm sure about these areas, but not sure about those."

### Who uses it

- Farmers checking crop health
- City planners mapping small buildings and narrow roads
- Disaster response teams identifying damaged areas
- Researchers doing land-cover analysis

### What makes our project stand out

Most "AI super-resolution" projects just make images look prettier. Ours is different because it:

1. Preserves **spectral information** (colors that correspond to real Earth materials)
2. Keeps **geographic accuracy** (pixels stay in the correct place on the map)
3. Reports **uncertainty** (never hides its guesswork)
4. Validates against **real high-resolution data**

---

## 2. The Full Stack (What We're Building)

```text
┌─────────────────────────────────────────────────┐
│              USER (Farmer / Researcher)         │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│      FRONTEND (Next.js + designed with Stitch)  │
│  - Upload page                                  │
│  - Job dashboard                                │
│  - Before/After viewer                          │
│  - Uncertainty overlay                          │
└──────────────────────┬──────────────────────────┘
                       │  REST API calls
                       ▼
┌─────────────────────────────────────────────────┐
│           BACKEND (FastAPI + Python)            │
│  - Auth & validation                            │
│  - Job orchestration                            │
│  - Preprocessing service                        │
└──────────┬──────────────────────┬───────────────┘
           │                      │
           ▼                      ▼
┌────────────────────┐   ┌──────────────────────┐
│  DATABASE (SQLite  │   │  ML WORKER (Celery)  │
│  → PostgreSQL)     │   │  - Loads AI model    │
│  Stores: users,    │   │  - Runs on GPU       │
│  jobs, metadata    │   │  - Returns outputs   │
└────────────────────┘   └──────────┬───────────┘
                                    │
                                    ▼
                       ┌──────────────────────┐
                       │  STORAGE (MinIO/S3)  │
                       │  - Input images      │
                       │  - Output GeoTIFFs   │
                       │  - Uncertainty maps  │
                       └──────────────────────┘
```

Each piece has one clear job. If one breaks, we fix that piece without touching the rest.

---

## 3. Technology Choices (and Why)

| Layer | Tech | Why |
|---|---|---|
| Design mockups | **Stitch (by Google)** | Fast way to generate clean UI mockups from text prompts |
| Frontend | **Next.js 14 + TypeScript** | Fast, SEO-friendly, great DX, easy deployment on Vercel |
| Styling | **Tailwind CSS + shadcn/ui** | Modern, clean, consistent — pairs well with Stitch exports |
| Backend | **FastAPI (Python)** | Same language as ML, async support, auto docs, easy to learn |
| ML Framework | **PyTorch** | Industry standard for research, good GPU support |
| Model | **Residual Swin Transformer SRM** | Balances quality and speed for satellite imagery |
| Job Queue | **Celery + Redis** | Handles long-running inference without blocking users |
| Database | **SQLite** (dev) → **PostgreSQL** (prod) | SQLite for simplicity, Postgres for scaling |
| ORM | **SQLAlchemy 2.0 + Alembic** | Clean Python-to-database mapping and migrations |
| Object Storage | **MinIO** (self-hosted, S3-compatible) | Lightweight, free, handles large satellite files |
| Geo libraries | **Rasterio, GDAL, TorchGeo** | For reading GeoTIFFs and preserving coordinates |
| Deployment | **Docker Compose** | One command spins up everything |
| Version control | **Git + GitHub** | Standard, plus GitHub Actions for CI |

### Why SQLite for the database?

For a college project prototype, SQLite is perfect:

- **Zero setup** — it's just a file on disk
- **Fast enough** for thousands of jobs and users
- **Built into Python** — no separate server to run
- **Easy to inspect** — open the file in DB Browser for SQLite

When we deploy to a real server for the SIH demo, we swap SQLite for PostgreSQL. SQLAlchemy makes this a **one-line configuration change** — no code rewrite.

---

## 4. Frontend — Next.js Designed with Stitch

### 4.1 What is Stitch?

Stitch is a Google tool that generates UI mockups from text descriptions. You type "landing page for a satellite image AI tool" and it produces clean, modern designs. It exports HTML/CSS or Figma files that we then rebuild as React components.

**Our workflow with Stitch:**

1. Describe each screen in plain English
2. Stitch generates the mockup
3. We copy the layout and structure
4. Rebuild it as Next.js components using Tailwind + shadcn/ui
5. Wire it up to our FastAPI backend

### 4.2 Pages We Will Build

| Page | Purpose |
|---|---|
| `/` — Landing | Explains what SRM is, big "Try It" button |
| `/upload` | Drag & drop Sentinel-2 file, choose bands, click Submit |
| `/jobs` | Table of all your submitted jobs with status |
| `/jobs/[id]` | Detail page: before/after slider, uncertainty overlay, download buttons |
| `/about` | Team, methodology, scientific disclaimers |
| `/docs` | User guide for uploading data |

### 4.3 Key Frontend Components

- **File Uploader** — accepts `.tif` GeoTIFF files, shows upload progress
- **Job Status Card** — polls the backend every 3 seconds, shows a progress bar
- **Image Comparison Slider** — drag left/right to compare original vs super-resolved
- **Uncertainty Overlay** — toggle a colored heatmap over the SR image (red = uncertain)
- **Metrics Panel** — shows PSNR, SSIM, SAM, ERGAS numbers
- **Download Buttons** — GeoTIFF, uncertainty map, preview PNG, metadata JSON

### 4.4 Frontend Folder Structure

```text
frontend/
├── app/                    ← Next.js 14 App Router
│   ├── page.tsx            ← Landing page
│   ├── upload/page.tsx
│   ├── jobs/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── layout.tsx
├── components/
│   ├── FileUploader.tsx
│   ├── JobStatusCard.tsx
│   ├── ComparisonSlider.tsx
│   ├── UncertaintyOverlay.tsx
│   └── MetricsPanel.tsx
├── lib/
│   ├── api.ts              ← wrapper for calling FastAPI
│   └── types.ts
├── public/
├── tailwind.config.ts
└── package.json
```

### 4.5 How Frontend Talks to Backend

We create a small `api.ts` file that wraps every backend call:

```typescript
// simplified example
export async function uploadImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_URL}/api/v1/jobs/sr`, {
    method: "POST",
    body: form,
  });
  return res.json();
}
```

The rest of the app just imports `uploadImage()` and doesn't worry about URLs. Clean separation.

---

## 5. Backend — FastAPI

### 5.1 What the Backend Does

The backend is the middle layer. It:

1. Receives requests from the frontend
2. Validates the uploaded satellite image
3. Saves it to storage
4. Creates a job record in the database
5. Sends the job to the ML worker
6. Reports progress back to the frontend
7. Returns final results and download links

FastAPI is perfect because it uses the **same language (Python) as our ML model**, so there's no awkward bridge between languages.

### 5.2 Backend Folder Structure

```text
backend/
├── app/
│   ├── main.py             ← starts the FastAPI server
│   ├── config.py           ← settings via .env file
│   ├── database.py         ← SQLAlchemy setup
│   │
│   ├── routes/             ← API endpoints
│   │   ├── health.py
│   │   ├── jobs.py
│   │   └── auth.py
│   │
│   ├── services/           ← business logic
│   │   ├── preprocess.py
│   │   ├── inference.py
│   │   ├── uncertainty.py
│   │   └── evaluation.py
│   │
│   ├── models_db/          ← database tables
│   │   ├── user.py
│   │   └── job.py
│   │
│   ├── schemas/            ← Pydantic request/response models
│   │   ├── job.py
│   │   └── metrics.py
│   │
│   └── workers/            ← Celery background tasks
│       └── tasks.py
│
├── ml_models/              ← trained .pth files
├── alembic/                ← database migrations
├── tests/
├── requirements.txt
└── Dockerfile
```

### 5.3 Key Endpoints

| Method | URL | Purpose |
|---|---|---|
| GET | `/health` | Is the server alive? |
| POST | `/api/v1/auth/register` | Create an account |
| POST | `/api/v1/auth/login` | Get a token |
| POST | `/api/v1/jobs/sr` | Upload image, start super-resolution |
| GET | `/api/v1/jobs` | List your jobs |
| GET | `/api/v1/jobs/{id}` | Check one job's status |
| GET | `/api/v1/jobs/{id}/result` | Download the outputs |
| GET | `/docs` | Auto-generated interactive API docs |

### 5.4 The Async Job Pattern

Super-resolution takes 30 seconds to a few minutes. We don't want the browser to hang waiting. So:

1. User uploads → server immediately returns a `job_id`
2. Server pushes the job into Redis queue
3. A Celery worker picks it up and runs the AI
4. Frontend polls `/jobs/{id}` every 3 seconds
5. When status = "done", frontend shows the result

This pattern is used by every real AI product (ChatGPT, DALL-E, Runway, etc.).

---

## 6. Database — SQLite (Dev) / PostgreSQL (Prod)

### 6.1 Why We Need One

We need to remember:

- Who uploaded what image
- Which jobs are running, done, or failed
- Where each output file is stored
- Which model version processed each image

### 6.2 Tables (Simple Schema)

**users**

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| email | text | unique |
| password_hash | text | never store plain passwords |
| created_at | timestamp | |

**jobs**

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| user_id | UUID | foreign key to users |
| status | enum | queued / running / done / failed |
| input_path | text | where input file is stored |
| output_path | text | where SR output is stored |
| uncertainty_path | text | where uncertainty map is stored |
| model_version | text | which AI model was used |
| metrics | JSON | PSNR, SSIM, SAM, ERGAS |
| created_at | timestamp | |
| finished_at | timestamp | |

**model_versions**

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| version | text | e.g. "srm-swin-v0.4.1" |
| checkpoint_path | text | path to .pth file |
| training_notes | text | short description |
| trained_at | timestamp | |

That's it. Three tables cover everything.

### 6.3 Why SQLite Now, PostgreSQL Later

**SQLite:**

- Perfect for local development and the SIH demo
- One file, zero server, backup by copying the file
- Handles hundreds of concurrent reads easily

**PostgreSQL:**

- Needed when we deploy to a cloud server with many users
- Better concurrent write performance
- Advanced features (JSONB, full-text search, PostGIS for geo data)

Because we use **SQLAlchemy** (a Python ORM), switching is a one-line change in `config.py`:

```python
# Dev
DATABASE_URL = "sqlite:///./srm.db"

# Prod
DATABASE_URL = "postgresql://user:pass@host/srm"
```

Nothing else in our code changes. That's the beauty of using an ORM.

---

## 7. ML Pipeline — The Brain

### 7.1 Model Choice: Residual Swin Transformer

We're using a **Swin Transformer with residual connections**. In plain English:

- **Transformer** = a modern deep learning architecture great at understanding both small and large patterns in images
- **Swin** = a Swin-Transformer looks at the image in shifting windows (efficient for big images)
- **Residual** = adds "shortcuts" so the network can preserve important input details

We picked this over GANs and diffusion models because those tend to **invent fake details** that look pretty but aren't scientifically true. For satellite imagery, honesty matters more than prettiness.

### 7.2 Training Data Strategy

**The problem:** We rarely have perfectly matched Sentinel-2 (10 m) and higher-resolution (<4 m) images of the exact same place at the exact same time.

**Our solution:** Two training modes.

**Mode A — Real pairs (preferred):**

- Find publicly available high-res satellite images
- Match them geographically and temporally with Sentinel-2 images
- Use these as ground truth

**Mode B — Degradation-based (fallback, more data):**

- Take high-res images
- Artificially blur and downsample them to simulate Sentinel-2
- Train the model to reverse this process

We use both, but never mix them without labeling which is which.

### 7.3 Loss Function (What the Model Optimizes)

Instead of just measuring pixel differences (which produces blurry outputs), we combine several losses:

| Loss | What It Preserves |
|---|---|
| Charbonnier | Overall pixel accuracy (stable version of MSE) |
| SAM (Spectral Angle Mapper) | Color/spectral correctness |
| Gradient | Sharp edges (roads, buildings) |
| Perceptual | Visual realism (used carefully) |
| Consistency | Downsampling the SR output must match the original input |

The **consistency loss** is our key trick against "hallucination" — it forces the model to only invent details that, when blurred back down, still look like the original input.

### 7.4 Uncertainty Estimation

We run the model **multiple times with slight randomness** (Monte Carlo dropout) and measure how much the outputs disagree. High disagreement = high uncertainty. We save this as a separate raster the user can view as a heatmap.

### 7.5 Inference Pipeline (Per User Upload)

```text
Input Sentinel-2 GeoTIFF
        ↓
Validate CRS, bands, geotransform
        ↓
Mask clouds using SCL band
        ↓
Normalize reflectance values
        ↓
Split into overlapping tiles (128×128 with 16 px overlap)
        ↓
Run each tile through the model (batched, on GPU)
        ↓
Run MC-dropout samples for uncertainty
        ↓
Blend tile outputs (feathered overlap)
        ↓
Restore CRS + geotransform (scaled by 4×)
        ↓
Write GeoTIFF with LZW compression
        ↓
Compute quality metrics if reference provided
        ↓
Save preview PNG for the frontend viewer
```

---

## 8. Storage — MinIO for Files

Satellite images can be **hundreds of MB each**. Storing them in a database is a bad idea. We use:

- **MinIO** — a lightweight, S3-compatible object storage server
- Runs in a single Docker container
- We reference files in the database by their path/URL
- In production, we can swap MinIO for AWS S3 or GCP Cloud Storage without code changes

**Bucket layout:**

```text
srm-inputs/
  {user_id}/{job_id}/input.tif

srm-outputs/
  {user_id}/{job_id}/super_resolved.tif
  {user_id}/{job_id}/uncertainty.tif
  {user_id}/{job_id}/preview.png
  {user_id}/{job_id}/metadata.json
```

Files older than 7 days are auto-deleted by a scheduled task (to save disk space during the demo).

---

## 9. Complete User Flow

Let's trace exactly what happens when a user uses our system:

```text
1. User visits our website (Next.js app on Vercel)
   → Sees landing page designed with Stitch

2. Clicks "Upload Image", drags a Sentinel-2 .tif file
   → Frontend calls POST /api/v1/jobs/sr with the file

3. FastAPI receives the file
   → Validates it's a real Sentinel-2 GeoTIFF
   → Saves it to MinIO under srm-inputs/
   → Creates a row in the "jobs" table with status="queued"
   → Pushes a task to Redis: { job_id, input_path }
   → Returns { job_id, poll_url } to the frontend

4. Frontend shows a progress card, polls /api/v1/jobs/{id} every 3s

5. A Celery worker picks up the task from Redis
   → Downloads the input from MinIO
   → Runs preprocessing (masking, normalization, tiling)
   → Loads the SRM model onto the GPU
   → Runs inference on all tiles
   → Runs MC-dropout samples for uncertainty
   → Stitches everything back together
   → Writes GeoTIFF outputs to MinIO under srm-outputs/
   → Updates the database row with status="done", output paths, metrics

6. Frontend's next poll sees status="done"
   → Fetches /api/v1/jobs/{id}/result
   → Shows the comparison slider, uncertainty overlay, and metrics
   → User clicks "Download GeoTIFF"

7. User inspects the sharpened image, notices the uncertainty map,
   and can now use it in QGIS or their own analysis pipeline
```

---

## 10. Deployment Strategy

### 10.1 Docker Compose for Everything

One file (`docker-compose.yml`) that starts:

- `frontend` — Next.js app
- `backend` — FastAPI server
- `worker` — Celery worker with CUDA
- `redis` — job queue
- `minio` — object storage
- `db` — PostgreSQL (SQLite for local dev)

Start it all with:

```bash
docker compose up --build
```

### 10.2 Where Each Piece Runs

| Component | Local Dev | Production (SIH Demo) |
|---|---|---|
| Frontend | localhost:3000 | Vercel free tier |
| Backend | localhost:8000 | Cloud VM (AWS/GCP) or Render |
| ML Worker | localhost (CPU) | GPU VM (Kaggle credits / Colab tunnel / AWS g4dn) |
| Database | SQLite file | Managed PostgreSQL |
| Storage | Local MinIO | MinIO or AWS S3 |

For the SIH demo, we can even run everything on a single laptop with a GPU.

---

## 11. Development Timeline (Suggested)

| Week | Focus |
|---|---|
| 1 | Team setup, Git repo, learn FastAPI + Next.js basics |
| 2 | Download Sentinel-2 sample data, explore in QGIS |
| 3 | Build baseline models (bicubic, SRCNN, EDSR) |
| 4 | Implement Residual Swin SRM architecture |
| 5 | Train first version on synthetic pairs (Mode B) |
| 6 | Add spectral + consistency losses |
| 7 | Build FastAPI backend with SQLite + local storage |
| 8 | Build Next.js frontend from Stitch mockups |
| 9 | Wire frontend to backend end-to-end |
| 10 | Add Celery + Redis for async jobs |
| 11 | Add uncertainty estimation + validation metrics |
| 12 | Docker Compose, deployment, demo polish |

Adjust based on team size and how much you already know.

---

## 12. Team Roles (For a 6-Person SIH Team)

| Role | Responsibilities |
|---|---|
| ML Engineer (2) | Model architecture, training, uncertainty |
| Backend Dev (1) | FastAPI, database, Celery |
| Frontend Dev (1) | Next.js, Stitch designs, viewer components |
| Data Engineer (1) | Sentinel-2 download, preprocessing, storage |
| Team Lead / Docs (1) | Presentation, README, submission, coordination |

Everyone should understand the big picture even if they don't touch every part.

---

## 13. Key Risks and How We Handle Them

| Risk | Our Response |
|---|---|
| Model "hallucinates" fake buildings | Consistency loss + uncertainty map + honest disclaimers |
| Not enough real training pairs | Mode B degradation synthesis + augmentation |
| GPU too small for training | Train on small tiles (128×128), use mixed precision |
| Backend slow under load | Async job queue, horizontal scaling of Celery workers |
| Frontend confusing to users | Clean Stitch designs, tooltips, sample images to try |
| Judge asks about scientific rigor | Show ablation study, geographic holdout test, metrics |
| Demo fails on stage | Pre-recorded video backup + local Docker Compose |

---

## 14. What Makes This Project Impressive

For SIH judges, we highlight:

1. **Full stack** — not just a model in a notebook, but a real usable product
2. **Scientific honesty** — uncertainty maps + consistency constraints
3. **Modern tech choices** — Next.js, FastAPI, Docker, MinIO
4. **Clean design** — Stitch-generated UI shows thought put into UX
5. **Reproducibility** — one `docker compose up` and the whole thing runs
6. **Real evaluation** — PSNR, SSIM, SAM, ERGAS, plus a downstream task
7. **Deployment ready** — SQLite for now, PostgreSQL when we scale

We're not just showing a model — we're showing that we can **ship a product**.

---

## 15. Quick Glossary

| Term | Meaning |
|---|---|
| Sentinel-2 | Free European satellite, 10 m resolution |
| Super Resolution | Making low-res images higher-res using AI |
| Residual Swin Transformer | The specific neural network we use |
| GeoTIFF | Image format that stores geographic coordinates |
| CRS | Coordinate Reference System (how pixels map to Earth) |
| Uncertainty Map | Heatmap showing where the AI is guessing |
| PSNR / SSIM | Quality metrics comparing two images |
| SAM / ERGAS | Metrics specifically for satellite/spectral data |
| FastAPI | Python framework for building APIs |
| Next.js | React framework for building websites |
| Stitch | Google tool to generate UI mockups |
| SQLAlchemy | Python library to talk to databases |
| Celery | System for running slow tasks in the background |
| Redis | Fast in-memory database used as a job queue |
| MinIO | Self-hosted S3-compatible file storage |
| Docker | Tool that packages apps into portable containers |

---

## 16. Summary

We are building a **full-stack, scientifically responsible super-resolution system** for Sentinel-2 satellite imagery.

- **Frontend:** Next.js designed with Stitch, gives users a clean way to upload and view results
- **Backend:** FastAPI with async job handling, coordinates everything
- **Database:** SQLite for dev, PostgreSQL for production (both via SQLAlchemy)
- **Storage:** MinIO for large satellite files
- **ML:** Residual Swin Transformer with physics-based losses and uncertainty estimation
- **Deployment:** Docker Compose so everything runs with one command

The core philosophy: **don't just make images sharper — make them useful and honest.**

That's the story we tell judges, users, and ourselves.
