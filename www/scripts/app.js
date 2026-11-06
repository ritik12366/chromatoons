/* ============================================================================
 * ChromaToons app bootstrap — replaces UI/AppBootstrap.cs.
 * Builds the header/nav, wires the toast and starts the Home panel.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;
  var cfg = C.AppConfig;

  var NAV = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'characters', icon: '🎭', label: 'Chars' },
    { id: 'animate', icon: '🕺', label: 'Animate' },
    { id: 'recording', icon: '⏺️', label: 'Record' },
    { id: 'settings', icon: '⚙️', label: 'More' }
  ];

  function boot() {
    /* header */
    var titleEl = document.getElementById('header-title');
    titleEl.textContent = cfg.appLabel;

    /* services */
    C.PremiumManager.initialize();
    C.AdManager.initialize();
    C.Recorder.init();
    C.Audio.init();
    C.AnimationStudio.init();

    C.Localization.setLang(C.Store.get('lang', 'en'));

    /* panel host + nav */
    var host = document.getElementById('panel-host');
    C.Panels.initialize(host);
    buildNav();

    /* toast */
    var toastEl = document.getElementById('toast');
    var toastTimer = 0;
    C.EventBus.on('toast', function (msg) {
      if (!msg) return;
      toastEl.textContent = msg;
      toastEl.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
    });

    /* title + nav highlight */
    C.EventBus.on('panel:changed', function (e) {
      var panel = C.Panels.get(e.to);
      if (panel) titleEl.textContent = panel.title || cfg.appLabel;
      Array.prototype.forEach.call(document.querySelectorAll('.nav__btn'), function (btn) {
        btn.classList.toggle('is-active', btn.dataset.panel === e.to);
        btn.setAttribute('aria-current', btn.dataset.panel === e.to ? 'page' : 'false');
      });
    });

    /* language change persists */
    C.EventBus.on('lang:changed', function (lang) { C.Store.set('lang', lang); });

    /* start */
    C.Panels.show('home');

    /* Android hardware back (called by the WebView wrapper) */
    global.chromaBack = function () {
      var cur = C.Panels.current();
      if (cur && cur !== 'home') { C.Panels.show('home'); return true; }
      if (global.ChromaNative && global.ChromaNative.exitApp) { global.ChromaNative.exitApp(); return true; }
      return false;
    };
  }

  function buildNav() {
    var nav = document.getElementById('nav');
    nav.innerHTML = '';
    NAV.forEach(function (item) {
      var btn = h('button', { class: 'nav__btn', type: 'button' }, [
        h('span', { class: 'nav__icon', text: item.icon }),
        h('span', { class: 'nav__label', text: item.label })
      ]);
      btn.dataset.panel = item.id;
      btn.addEventListener('click', function () { C.Panels.show(item.id); });
      nav.appendChild(btn);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
