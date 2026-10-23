/* Theme Manager - 6 switchable UI themes, remembered in localStorage */
const THEMES = [
  { id: 'aurora',  name: 'Aurora Violet',  a: '#6366f1', b: '#a855f7' },
  { id: 'cyber',   name: 'Cyber Neon',     a: '#ff2e93', b: '#22f5e1' },
  { id: 'emerald', name: 'Emerald Forest', a: '#10b981', b: '#a3e635' },
  { id: 'sunset',  name: 'Sunset Ember',   a: '#f97316', b: '#ec4899' },
  { id: 'ocean',   name: 'Ocean Breeze',   a: '#0ea5e9', b: '#2dd4bf' },
  { id: 'pearl',   name: 'Pearl Light',    a: '#4f46e5', b: '#e2e8f0' }
];

const ThemeManager = {
  KEY: 'placement_theme',

  get() {
    try { return localStorage.getItem(this.KEY) || 'aurora'; } catch (e) { return 'aurora'; }
  },

  apply(id) {
    if (!THEMES.some(t => t.id === id)) id = 'aurora';
    document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem(this.KEY, id); } catch (e) { /* ignore */ }
    document.querySelectorAll('.theme-option, .login-theme-chip').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === id);
    });
    const label = document.getElementById('themeLabel');
    const t = THEMES.find(x => x.id === id);
    if (label && t) label.textContent = t.name;
  },

  buildUI() {
    // Header dropdown
    const menu = document.getElementById('themeMenu');
    if (menu) {
      menu.innerHTML = THEMES.map(t => `
        <button class="theme-option" data-theme="${t.id}" type="button">
          <span class="theme-swatch" style="background: linear-gradient(135deg, ${t.a}, ${t.b});"></span>
          ${t.name}
          <i class="ri-check-line"></i>
        </button>`).join('');
      menu.querySelectorAll('.theme-option').forEach(btn =>
        btn.addEventListener('click', () => { this.apply(btn.dataset.theme); menu.classList.remove('open'); }));
    }
    const toggle = document.getElementById('themeToggle');
    if (toggle && menu) {
      toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-picker')) menu.classList.remove('open');
      });
    }
    // Login screen chips
    const row = document.getElementById('loginThemeRow');
    if (row) {
      row.innerHTML = THEMES.map(t =>
        `<button class="login-theme-chip" type="button" data-theme="${t.id}" title="${t.name}"
          style="background: linear-gradient(135deg, ${t.a}, ${t.b});"></button>`).join('');
      row.querySelectorAll('.login-theme-chip').forEach(btn =>
        btn.addEventListener('click', () => this.apply(btn.dataset.theme)));
    }
    this.apply(this.get());
  }
};

// apply saved theme immediately (avoids flash), build UI once DOM is ready
document.documentElement.setAttribute('data-theme', ThemeManager.get());
document.addEventListener('DOMContentLoaded', () => ThemeManager.buildUI());
