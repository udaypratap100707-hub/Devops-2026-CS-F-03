# FSD + DevOps Guide

## 1. Project layout
```
server.js              Express REST API + serves the frontend
lib/db.js              data layer: MongoDB (or in-memory for tests / quick demo)
lib/password.js        scrypt password hashing      lib/token.js  signed login tokens
lib/env.js             tiny .env loader
scripts/seed.js        demo data                    scripts/migrate-json-to-mongo.js  old data/store.json -> MongoDB
frontend/src/          client (index.html, css/, js/)
tests/api.test.js      19 API tests (in-memory OR real MongoDB)
Dockerfile  docker-compose.yml  Jenkinsfile  .github/workflows/ci.yml  k8s/  nginx/  Makefile
```

## 2. MongoDB
| Where | `MONGODB_URI` |
|---|---|
| Local MongoDB | `mongodb://127.0.0.1:27017/campus_placement` (default) |
| Docker Compose | set automatically (`mongodb://mongo:27017/campus_placement`) |
| MongoDB Atlas (free cloud) | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/campus_placement` |

Collections: `users, students, companies, drives, applications, shortlists, interviews, placements, notifications`.
Unique indexes: `id` on every collection, `users.email`, and one application per `(studentId, driveId)`.

```bash
cp .env.example .env     # set MONGODB_URI, AUTH_SECRET, ADMIN_* and TPO_* then:
npm start
npm run migrate          # one time: import your old data/store.json into MongoDB (passwords get hashed)
npm run seed             # optional: demo companies, students, drives, 1 pending company request
```
No database handy? `DB_DRIVER=memory npm start` runs everything in memory (data is lost when you stop it).

## 3. Who can do what
| | Candidate | Company | TPO | Admin |
|---|---|---|---|---|
| Self-register | yes | yes (needs approval) | **no** | **no** |
| Sign in | yes | only after approval | yes | yes |
| Approve / reject company requests | | | yes | yes |
| Post drives | | own company | yes | yes |
| Apply to drives | yes | | | |
| Update application status, schedule interviews | | own company | yes | yes |
| See students / applications | only own data | only own company's | all | all |
| DevOps Monitor, metrics, logs | | | | yes |

**Admin and TPO accounts** are created at start-up from `ADMIN_EMAIL/ADMIN_PASSWORD` and `TPO_EMAIL/TPO_PASSWORD` (or by `npm run seed`). The Quick Persona switcher and the 1-click demo-login box were removed.

**Company approval flow:** company registers -> status `Pending Approval` (cannot sign in) -> Admin/TPO opens **Company Requests** (red badge shows the count) -> **Approve** (company can sign in, post drives) or **Reject** with a reason (shown to the company when it tries to sign in).

## 4. How login works
`POST /api/auth/login` returns a signed token (HMAC-SHA256, 8 h). The frontend stores it and sends `Authorization: Bearer <token>` on every call (`frontend/src/js/api.js`). The server checks the token on every `/api` request except health, version, docs, prometheus, login and register, and each route checks the role.
Set a long random `AUTH_SECRET` in production, otherwise everyone is signed out when the server restarts.

## 5. Frontend <-> backend connection
- `server.js` serves `frontend/src`, so page and API share one origin.
- `frontend/src/js/config.js` -> `API_BASE` (default `/api`). Hosting the frontend elsewhere? Put the full backend URL there (CORS is enabled).
- Header pill shows **Backend online/offline** (polls `/api/health`, which also pings MongoDB and returns 503 if the database is down).

## 6. Run / deploy
| Way | Command |
|---|---|
| Node | `npm start` |
| Dev (auto restart) | `npm run dev` |
| Docker Compose (app + MongoDB) | `docker compose up -d --build` -> http://localhost:3000 |
| + Nginx | `docker compose --profile proxy up -d` -> http://localhost |
| Kubernetes | `kubectl apply -f k8s/secret.yaml -f k8s/mongo.yaml -f k8s/deployment.yaml` (copy `secret.example.yaml` first) |

## 7. Testing & CI/CD
- `npm test` -> 19 tests on the in-memory store. `TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm test` -> the same tests on real MongoDB (throw-away database, dropped afterwards).
- GitHub Actions (`ci.yml`): lint + tests (Node 18/20/22) + tests against a MongoDB service container -> build Docker image -> push to GHCR.
- Jenkins: `Jenkinsfile` (Windows or Linux agent, needs only Docker).

## 8. Likely viva questions
- **Why MongoDB instead of a JSON file?** Concurrent writes are safe, queries/indexes scale, several app instances can share one database, data survives container restarts.
- **Why unique indexes?** The database itself refuses duplicate emails or double applications, even if two requests arrive at the same moment.
- **How is access controlled?** Signed token -> middleware loads the user -> `allow('admin','tpo')` checks the role; recruiters/students are additionally scoped to their own data.
- **Why can't admin/TPO register?** Anyone could otherwise make themselves admin. Staff accounts come from server configuration only.
- **Why hash passwords (scrypt)?** A leaked database must not reveal passwords; scrypt is salted and deliberately slow.
- **Liveness vs readiness?** Both use `/api/health`, which now also checks MongoDB, so Kubernetes stops sending traffic when the database is unreachable.
- **Why a memory store for tests?** Fast tests without infrastructure; CI additionally runs the same tests on real MongoDB.
- **Why multi-stage Dockerfile?** `test` runs lint+tests, `deps` installs production packages only, `runtime` is small and non-root.
