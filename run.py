#!/usr/bin/env python3
"""Start the backend (FastAPI) and frontend (Vite) together on any OS.

Usage:
    python run.py              # set up if needed, then run both
    python run.py --backend    # backend only
    python run.py --frontend   # frontend only
    python run.py --setup-only # install dependencies and exit
    python run.py --open       # also open the site in the browser

See RUNNING.md for details.
"""

import argparse
import hashlib
import os
import shutil
import signal
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV = BACKEND / "venv"
IS_WINDOWS = os.name == "nt"

COLORS = {"backend": "\033[36m", "frontend": "\033[35m", "run": "\033[33m"}
RESET = "\033[0m"

if IS_WINDOWS:
    os.system("")  # enables ANSI colors in the Windows console


def log(msg, name="run"):
    print(f"{COLORS.get(name, '')}[{name}]{RESET} {msg}", flush=True)


def fail(msg):
    log(f"ERROR: {msg}")
    sys.exit(1)


def venv_python():
    if IS_WINDOWS:
        return VENV / "Scripts" / "python.exe"
    return VENV / "bin" / "python"


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def setup_backend():
    if sys.version_info < (3, 12):
        log(f"Warning: Python 3.12+ is recommended (found {sys.version.split()[0]})")

    if not venv_python().exists():
        log("Creating Python virtual environment in backend/venv ...")
        subprocess.run([sys.executable, "-m", "venv", str(VENV)], check=True)

    requirements = BACKEND / "requirements.txt"
    stamp = VENV / ".requirements.sha256"
    current = file_hash(requirements)
    if not stamp.exists() or stamp.read_text().strip() != current:
        log("Installing backend dependencies ...")
        subprocess.run(
            [str(venv_python()), "-m", "pip", "install", "-r", str(requirements)],
            check=True,
        )
        stamp.write_text(current)

    env_file = BACKEND / ".env"
    if not env_file.exists():
        shutil.copy(BACKEND / ".env.example", env_file)
        log("Created backend/.env from .env.example (edit it if needed)")


def npm_command():
    npm = shutil.which("npm")
    if not npm:
        fail("npm not found. Install Node.js 18+ from https://nodejs.org")
    return npm


def setup_frontend():
    npm = npm_command()
    modules_lock = FRONTEND / "node_modules" / ".package-lock.json"
    lock = FRONTEND / "package-lock.json"
    if not modules_lock.exists() or lock.stat().st_mtime > modules_lock.stat().st_mtime:
        log("Installing frontend dependencies ...")
        subprocess.run([npm, "install"], cwd=FRONTEND, check=True)


def stream_output(name, proc, open_url=None):
    for line in iter(proc.stdout.readline, ""):
        log(line.rstrip(), name)
        if open_url and "Local:" in line:
            webbrowser.open(open_url)
            open_url = None


def start(name, cmd, cwd, open_url=None):
    kwargs = {}
    if IS_WINDOWS:
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True

    env = {**os.environ, "PYTHONUNBUFFERED": "1"}
    proc = subprocess.Popen(
        cmd, cwd=cwd, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8", errors="replace", bufsize=1,
        **kwargs,
    )
    threading.Thread(target=stream_output, args=(name, proc, open_url), daemon=True).start()
    return proc


def stop(proc):
    if proc.poll() is not None:
        return
    try:
        if IS_WINDOWS:
            subprocess.run(
                ["taskkill", "/T", "/F", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
        else:
            os.killpg(proc.pid, signal.SIGTERM)
        proc.wait(timeout=10)
    except Exception:
        proc.kill()


def main():
    parser = argparse.ArgumentParser(description="Run the blogging website locally.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--backend", action="store_true", help="run only the backend")
    group.add_argument("--frontend", action="store_true", help="run only the frontend")
    parser.add_argument("--setup-only", action="store_true", help="install dependencies and exit")
    parser.add_argument("--open", action="store_true", help="open the site in a browser once ready")
    parser.add_argument("--backend-port", type=int, default=8000)
    parser.add_argument("--frontend-port", type=int, default=5173)
    args = parser.parse_args()

    run_backend = not args.frontend
    run_frontend = not args.backend

    if run_backend:
        setup_backend()
    if run_frontend:
        setup_frontend()
    if args.setup_only:
        log("Setup complete.")
        return

    procs = {}
    if run_backend:
        procs["backend"] = start(
            "backend",
            [str(venv_python()), "-m", "uvicorn", "app.main:app",
             "--reload", "--port", str(args.backend_port)],
            BACKEND,
        )
    if run_frontend:
        procs["frontend"] = start(
            "frontend",
            [npm_command(), "run", "dev", "--", "--port", str(args.frontend_port)],
            FRONTEND,
            open_url=f"http://localhost:{args.frontend_port}" if args.open else None,
        )

    if run_backend:
        log(f"Backend:  http://localhost:{args.backend_port}  (docs: /docs)")
    if run_frontend:
        log(f"Frontend: http://localhost:{args.frontend_port}")
    log("Press Ctrl+C to stop.")

    def interrupt(*_):
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, interrupt)
    signal.signal(signal.SIGTERM, interrupt)

    try:
        while True:
            for name, proc in procs.items():
                if proc.poll() is not None:
                    log(f"{name} exited with code {proc.returncode}; shutting down.")
                    raise KeyboardInterrupt
            time.sleep(0.5)
    except KeyboardInterrupt:
        log("Stopping ...")
    finally:
        for proc in procs.values():
            stop(proc)
        log("Stopped.")


if __name__ == "__main__":
    main()
