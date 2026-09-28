# Running the project (Windows, macOS, Linux)

`run.py` in the project root starts the **backend** (FastAPI) and the **frontend** (Vite + React) with a single command. It works the same on every operating system and only uses Python's standard library.

## 1. Install the prerequisites (one time)

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.12+ | https://www.python.org/downloads/ |
| Node.js (includes npm) | 18+ | https://nodejs.org |

Windows: when installing Python, tick **"Add python.exe to PATH"**.

Check that they're installed:

```bash
python --version     # or python3 --version on macOS/Linux
node --version
npm --version
```

No database server is needed. The backend stores its data in a local SQLite file, `backend/blog.db`, which is created automatically.

## 2. Run the project

Open a terminal in the project folder (`blogging-website/`) and run:

**Windows (PowerShell or Command Prompt)**

```powershell
python run.py
```

(If `python` isn't found, try `py run.py`.)

**macOS / Linux**

```bash
python3 run.py
```

Then open:

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

Press **Ctrl+C** in the terminal to stop both servers.

Output from each server is prefixed with `[backend]` or `[frontend]`, so you can tell them apart.

## What the script does

On every run, the script:

1. Creates the Python virtual environment `backend/venv` if it doesn't exist.
2. Installs backend packages from `backend/requirements.txt`, but only on the first run or when that file changes.
3. Copies `backend/.env.example` to `backend/.env` if `.env` is missing.
4. Runs `npm install` in `frontend/` if `node_modules` is missing or `package-lock.json` has changed.
5. Starts `uvicorn app.main:app --reload` on port 8000 and `npm run dev` on port 5173.
6. If either server crashes, it stops the other one too.

The first run can take a few minutes while dependencies install. Later runs start almost immediately.

## Options

| Command | What it does |
|---------|--------------|
| `python run.py` | Set up if needed, then run backend + frontend |
| `python run.py --backend` | Run only the backend |
| `python run.py --frontend` | Run only the frontend |
| `python run.py --setup-only` | Install everything, then exit without starting servers |
| `python run.py --open` | Open the site in the browser once the frontend is ready |
| `python run.py --backend-port 9000` | Use a different backend port |
| `python run.py --frontend-port 3000` | Use a different frontend port |
| `python run.py --help` | Show all options |

On macOS/Linux, replace `python` with `python3`.

Note: the frontend proxies `/sitemap.xml` and `/robots.txt` to port 8000 (see `frontend/vite.config.js`). If you change the backend port, update that file too.

## Configuration

Backend settings are stored in `backend/.env`, which is created automatically on the first run:

```text
SECRET_KEY=change-me-to-a-long-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

Default admin login: `admin@example.com` / `admin123`.

By default, data is stored in `backend/blog.db`. To start with an empty site, stop the servers and delete that file.

To use PostgreSQL instead, add this line to `backend/.env`:

```text
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

## Troubleshooting

**`python` / `python3` is not recognized**
Python isn't on your PATH. Reinstall it with "Add to PATH" ticked (Windows), or use `py run.py`.

**`npm not found`**
Install Node.js from https://nodejs.org, then open a new terminal.

**Backend fails with a database connection error**
Your `backend/.env` has a `DATABASE_URL` pointing to a PostgreSQL server that isn't running. Start that server, or remove the `DATABASE_URL` line to use the built-in SQLite file.

**Port already in use**
Another program is using port 8000 or 5173. Stop it, or use `--backend-port` / `--frontend-port`.

**Dependencies seem broken**
Delete `backend/venv` and/or `frontend/node_modules`, then run the script again. They will be reinstalled.

**Moving the project from another OS**
A `backend/venv` created on Linux/macOS won't work on Windows, and the reverse is also true. Delete `backend/venv` and let the script recreate it.
