# Student Placement System - Frontend (Themed UI)

Same app, same API, same features - now with **6 switchable themes** and a refreshed UI.

## Run
```bash
npm install
npm start        # http://localhost:3000
```
The server serves `public/` if present, otherwise `src/`.
It reads/writes `data/store.json` (keep your original `data/` folder next to `server.js`).

## Themes
Pick from the palette button in the header (or the colour dots on the login screen):
Aurora Violet (default) - Cyber Neon - Emerald Forest - Sunset Ember - Ocean Breeze - Pearl Light.
Choice is saved in `localStorage` (`placement_theme`).

Add your own: copy a block in `src/css/themes.css`, change the colours, and add an entry to `THEMES` in `src/js/theme.js`.

## What changed
- `src/css/themes.css` (new) - design tokens per theme + UI upgrade (animated glow background, view transitions, button shine, nav glow, responsive header/sidebar)
- `src/js/theme.js` (new) - theme manager + picker
- `src/css/styles.css` - hard-coded colours replaced with theme variables
- `src/index.html` - theme picker + login theme dots
- `src/js/*.js` - only inline `#fff` text colours switched to `var(--text-strong)`; **no logic changes**
- `server.js` - static folder falls back to `src/`

## New in v1.1 - FSD + DevOps features
Admin panel -> **DevOps Monitor** and **API Explorer**; backend `/api/health|version|metrics|logs|docs`; rate limiting + security headers;
12 automated tests; `Dockerfile`, `docker-compose.yml`, Nginx config, Kubernetes manifests, GitHub Actions CI/CD, `Jenkinsfile`, `Makefile`.
Full explanation + viva Q&A: **docs/DEVOPS_GUIDE.md**.

```bash
npm test                      # lint + tests
docker compose up -d --build  # run in a container
```

## Push to GitHub
```bash
git init
git add .
git commit -m "feat: new multi-theme UI"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
(`push.sh` / `push.bat` do this for you.)
