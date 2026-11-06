/* Settings panel — replaces UI/Panels/SettingsPanel.cs */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;
  var cfg = C.AppConfig;
  var Native = global.ChromaNative || null;

  C.Panels.register({
    id: 'settings',
    title: 'Settings',
    navLabel: 'More',
    icon: '⚙️',
    render: function (el) {
      /* language */
      el.appendChild(C.UI.sectionTitle('Language'));
      var en = C.UI.chip('English', C.Localization.lang === 'en', setLang('en'));
      var hi = C.UI.chip('हिन्दी', C.Localization.lang === 'hi', setLang('hi'));
      var langRow = h('div', { class: 'chip-row' }, [en, hi]);
      el.appendChild(langRow);

      function setLang(code) {
        return function () {
          C.Localization.setLang(code);
          en.classList.toggle('is-on', code === 'en');
          hi.classList.toggle('is-on', code === 'hi');
          C.EventBus.emit('toast', 'Language: ' + (code === 'hi' ? 'हिन्दी' : 'English'));
        };
      }

      /* toggles */
      el.appendChild(C.UI.sectionTitle('Preferences'));
      var vibOn = C.Store.get('vibration', true);
      var vib = C.UI.chip('Vibration', vibOn, function () {
        vibOn = !vibOn;
        C.Store.set('vibration', vibOn);
        vib.classList.toggle('is-on', vibOn);
      });
      el.appendChild(vib);

      /* links */
      el.appendChild(C.UI.sectionTitle('Links'));
      el.appendChild(C.UI.button('Rate Us', 'btn--block', function () { global.open(cfg.rateUrl, '_blank'); }));
      el.appendChild(C.UI.button('Share App', 'btn--block', shareApp));
      el.appendChild(C.UI.button('Telegram Support', 'btn--block', function () { global.open(cfg.telegramUrl, '_blank'); }));
      el.appendChild(C.UI.button('Privacy Policy', 'btn--block', function () { global.open(cfg.privacyUrl, '_blank'); }));
      el.appendChild(C.UI.button('Recording Gallery', 'btn--block', function () { C.Panels.show('gallery'); }));
      el.appendChild(C.UI.button('Character Blog', 'btn--block', function () { C.Panels.show('blog'); }));
      el.appendChild(C.UI.button('Help & Support', 'btn--block', function () { C.Panels.show('help'); }));

      /* data */
      el.appendChild(C.UI.sectionTitle('Data'));
      el.appendChild(C.UI.button('Reset All Data', 'btn--danger btn--block', function () {
        if (!global.confirm('Erase characters, projects and gallery?')) return;
        ['characters', 'projects', 'scene', 'gallery'].forEach(function (k) { C.Store.remove(k); });
        C.Scene.clear();
        if (C.AnimationStudio) C.AnimationStudio.createEmptyRig();
        C.EventBus.emit('characters:changed');
        C.EventBus.emit('toast', 'All data reset');
      }));
      el.appendChild(C.UI.button('Quit App', 'btn--block', function () {
        if (Native && Native.exitApp) Native.exitApp();
        else global.close();
      }));

      el.appendChild(h('div', { class: 'center muted', style: { marginTop: '18px' } },
        'Chroma Toons ' + cfg.versionName + ' (' + cfg.versionCode + ') — free build'));

      function shareApp() {
        var url = cfg.rateUrl;
        if (navigator.share) {
          navigator.share({ title: 'Chroma Toons', text: 'Try Chroma Toons!', url: url }).catch(function () { });
        } else {
          global.open(url, '_blank');
        }
      }
    }
  });
})(window);
