# FSD + DevOps Guide

## 1. Run it
| Way | Command | URL |
|---|---|---|
| Plain Node | `npm install && npm start` | http://localhost:3000 |
| Dev (auto-restart) | `npm run dev` | http://localhost:3000 |
| Docker | `docker build -t placement . && docker run -p 3000:3000 placement` | http://localhost:3000 |
| Docker Compose | `docker compose up -d --build` | http://localhost:3000 |
| Compose + Nginx | `docker compose --profile proxy up -d` | http://localhost |
| Kubernetes | edit image in `k8s/deployment.yaml`, then `kubectl apply -f k8s/` | LoadBalancer IP |

## 2. New features (login as Admin -> "DEVOPS & TOOLS")
- **DevOps Monitor** - live health, uptime, memory, request count, latency, status-code chart, CI/CD pipeline diagram, request log with **CSV export**, auto-refresh.
- **API Explorer** - mini Swagger: search/filter all endpoints, "Try it" for GET calls, copy ready-made **cURL** commands.
- **Backend:** `/api/health`, `/api/version`, `/api/metrics`, `/api/metrics/prometheus`, `/api/logs`, `/api/docs`
- **Security / reliability:** security headers, login rate limiting (429), JSON 404/500 handlers, graceful shutdown on SIGTERM.
- **6 UI themes** (see README).

## 3. Testing
`npm run lint` (syntax check of all JS) and `npm test` (12 automated tests using Node's built-in test runner; they start the real server on a random port with a temporary data file).

## 4. CI/CD flow (`.github/workflows/ci.yml`)
push / PR -> **lint + test** on Node 18/20/22 -> (on push) **build Docker image** -> **push to GitHub Container Registry** (`ghcr.io/<user>/<repo>`).
`Jenkinsfile` is the same pipeline for Jenkins.

## 5. Config (environment variables)
`PORT`, `NODE_ENV`, `AUTH_RATE_LIMIT`, `GIT_SHA`, `DATA_FILE` - see `.env.example`.

## 6. Likely viva questions (with short answers)
- **Why a multi-stage Dockerfile?** Dev tooling stays out of the final image, so it is smaller and safer; it also runs as the non-root `node` user.
- **Liveness vs readiness probe?** Liveness restarts a stuck container; readiness decides whether it receives traffic. Both call `/api/health` here.
- **What is CI vs CD?** CI = automatically build and test every change. CD = automatically ship the passing build (here: publish the Docker image).
- **Why a volume in docker-compose?** Containers are disposable; the volume keeps `data/store.json` when the container is recreated.
- **Why rate-limit login?** Slows brute-force password guessing (returns HTTP 429).
- **What does the Prometheus endpoint do?** Exposes metrics as text so Prometheus can scrape them and Grafana can chart them.
- **Why graceful shutdown?** Docker/Kubernetes send SIGTERM; the server finishes in-flight requests before exiting, so deploys don't drop requests.
- **REST verbs used?** GET (read), POST (create), PUT (update) - see API Explorer.
