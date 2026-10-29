/* Frontend -> Backend connection settings
 * By default the backend serves this frontend, so a relative '/api' works everywhere (local, Docker, Kubernetes).
 * If you host the frontend separately (e.g. GitHub Pages / Netlify), set the full backend URL, e.g.:
 *   API_BASE: 'https://your-backend.onrender.com/api'
 * (CORS is already enabled on the backend.)
 */
window.APP_CONFIG = {
  API_BASE: '/api'
};
