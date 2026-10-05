# RUNPROTO — Set up & run भू DRISTI

This file is a **complete, self-contained runbook** for getting the भू DRISTI
(AI Super-Resolution Platform) prototype running on a fresh **macOS** or
**Windows** laptop. It is written so a human *or an AI agent* can follow it
top-to-bottom with no prior context.

The demo runs **fully standalone** — the Next.js frontend ships its own mock API,
so you do **not** need the Python backend, a database, or any cloud keys to see
everything work.

---

## 0. TL;DR (fastest path)

**macOS / Linux**
```bash
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

**Windows (PowerShell)**
```powershell
cd frontend
npm install
npm run dev
# open http://localhost:3000
```

Or run the helper script from the project root:
- macOS/Linux: `bash scripts/setup.sh`
- Windows: `powershell -ExecutionPolicy Bypass -File scripts\setup.ps1`

---

## 1. Prerequisites

| Tool | Version | Needed for | Check |
| ---- | ------- | ---------- | ----- |
| **Node.js** | **≥ 18.17** (20 LTS recommended) | Frontend (required) | `node -v` |
| **npm** | ships with Node | Frontend (required) | `npm -v` |
| Python | ≥ 3.10 | Optional FastAPI backend only | `python --version` |
| Git | any | Optional (cloning) | `git --version` |

Install Node from <https://nodejs.org> (choose the **LTS** installer). On macOS
you may instead use `brew install node@20`, or `nvm install 20 && nvm use 20`.

> The frontend needs **only Node**. Skip Python unless you specifically want to
> run the standalone backend in Section 6.

---

## 2. Get the project onto the laptop

If you received a zip, unzip it. If it's a git repo, `git clone <url>`.
The folder you want (the one that contains `frontend/`, `backend/`, and this
`RUNPROTO.md`) is the **project root**. All paths below are relative to it.

> A shared copy will **not** include `node_modules/` or `.next/` — that's normal;
> Section 3 recreates them.

---

## 3. Install & run the frontend (required)

```bash
cd frontend
npm install          # installs dependencies (~1–2 min the first time)
npm run dev          # starts the dev server on http://localhost:3000
```

Open <http://localhost:3000> — it redirects to `/dashboard`. Leave this terminal
running; press `Ctrl+C` to stop the server.

---

## 4. Verify it works (acceptance checklist)

With `npm run dev` running, confirm each:

- [ ] `/dashboard` shows KPI cards, a Recent Job with **LR → SR satellite images**
      and a thermal **Uncertainty Map**.
- [ ] Sidebar and browser tab show the **भू DRISTI** name and satellite logo.
- [ ] `/comparison` — dragging the divider slides between the low-res and
      super-resolved image.
- [ ] `/validation` → **Export Report (PDF)** downloads a PDF file.
- [ ] `/queue`, `/projects`, `/new-job`, `/settings` all load without errors.
- [ ] `/login` and `/signup` render the split-screen auth pages.

All screens use synthetic demo data — no real/classified imagery.

---

## 5. Automated tests (optional but recommended)

Unit tests need **no** server:
```bash
cd frontend
npm run test:unit
```

Full suite (unit + live API/PDF integration) needs the dev server running:
```bash
# Terminal A:
cd frontend && npm run dev
# Terminal B:
cd frontend && npm test        # expect: 16 passing
```

---

## 6. Optional — run the real FastAPI backend

The frontend works without this. Do it only to serve the API from Python.

```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # API + docs at http://localhost:8000/docs
```

Point the frontend at it:
```bash
cd ../frontend
cp .env.local.example .env.local               # Windows: Copy-Item .env.local.example .env.local
# .env.local now contains NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev                                     # restart if it was running
```

Backend tests (no server needed): `cd backend && python -m unittest discover -s tests`

---

## 7. Production build (optional)

```bash
cd frontend
npm run build      # compiles an optimized build (should finish with exit code 0)
npm start          # serves the production build on http://localhost:3000
```

---

## 8. Troubleshooting

- **Port 3000 already in use**
  - Run on another port: `npm run dev -- -p 3001`
  - Or free it — macOS/Linux: `lsof -ti:3000 | xargs kill -9`;
    Windows: `Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
- **`node`/`npm` not found** — install Node LTS (Section 1) and reopen the terminal.
- **Old Node version** — install Node 20 (`nvm install 20 && nvm use 20`).
- **`npm install` errors / half-installed** — delete `frontend/node_modules` and
  re-run `npm install`.
- **Windows: "running scripts is disabled"** — launch the helper with
  `powershell -ExecutionPolicy Bypass -File scripts\setup.ps1`.
- **Logo/images missing** — ensure `frontend/public/brand-logo.png` and
  `frontend/public/imagery/*.jpg` exist (they ship with the project).
- **Python step fails** — the frontend does not need Python; skip Section 6.

---

## 9. Agent execution plan (for an AI agent)

Follow in order; stop and report if any step fails.

1. **Detect OS** → choose PowerShell commands on Windows, bash on macOS/Linux.
2. **Verify Node**: run `node -v`. If missing or major version `< 18`, stop and
   tell the user to install Node 20 LTS from nodejs.org; do not attempt a silent
   global install.
3. **Locate the project root** (the directory containing `frontend/` and this
   file). `cd` into it.
4. **Install**: `cd frontend && npm install`. Treat a non-zero exit as failure.
5. **Sanity check**: `npm run typecheck` (must exit 0).
6. **Start**: `npm run dev` as a background/long-running process. Wait until the
   log prints `Ready` or an HTTP GET to `http://localhost:3000/api/dashboard`
   returns 200 (poll for up to ~60s).
7. **Verify**: GET `http://localhost:3000/dashboard` returns 200; optionally GET
   `http://localhost:3000/api/reports/validation/DEMO` and confirm the response
   starts with the bytes `%PDF-`.
8. **Report** the local URL (`http://localhost:3000`) to the user and how to stop
   it (`Ctrl+C`).
9. Do **not** run Section 6 (Python backend) unless the user asks — it is optional.
10. Never commit or transmit `.env.local`, `node_modules/`, or `.next/`.

---

_भू DRISTI is a UI demonstration with synthetic data. No real credentials,
imagery, or classified data are included or transmitted._
