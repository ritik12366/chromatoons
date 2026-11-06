/* ============================================================================
 * ChromaToons.Core — shared configuration, event bus, persistence, localization.
 * This is the non-Unity replacement for Assets/Scripts/Core/* of the old build.
 * ==========================================================================*/
(function (global) {
  'use strict';

  /* ---- Identity: same values as the original "Chroma Toons App" ---- */
  var AppConfig = {
    packageName: 'bhootiyadreamstv.moboapp.chromatoons',
    versionCode: 187,
    versionName: '174',
    appLabel: 'Chroma Toons App',
    blogFeedUrl: 'https://www.chromatoons.com/search/label/Characters?&max-results=5',
    siteUrl: 'https://www.chromatoons.com/',
    telegramUrl: 'https://t.me/chromatoons',
    rateUrl: 'https://play.google.com/store/apps/details?id=bhootiyadreamstv.moboapp.chromatoons',
    privacyUrl: 'https://www.chromatoons.com/p/privacy.html',
    /* FREE build: everything unlocked, no ads, no billing. */
    allFeaturesFree: true,
    maxRecordingSeconds: 3600,
    prefsPrefix: 'chromatoons.'
  };

  /* ---- Event bus (mirrors Core/EventBus.cs) ---- */
  var EventBus = (function () {
    var handlers = {};
    return {
      on: function (type, fn) {
        (handlers[type] || (handlers[type] = [])).push(fn);
        return function () { EventBus.off(type, fn); };
      },
      off: function (type, fn) {
        var list = handlers[type];
        if (!list) return;
        var i = list.indexOf(fn);
        if (i >= 0) list.splice(i, 1);
      },
      emit: function (type, detail) {
        (handlers[type] || []).slice().forEach(function (fn) {
          try { fn(detail); } catch (e) { console.error('[EventBus]', type, e); }
        });
      }
    };
  })();

  /* ---- Persistence (localStorage). Replaces SaveSystem.cs ---- */
  var Store = {
    key: function (name) { return AppConfig.prefsPrefix + name; },
    get: function (name, fallback) {
      try {
        var raw = localStorage.getItem(this.key(name));
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (name, value) {
      try { localStorage.setItem(this.key(name), JSON.stringify(value)); }
      catch (e) { console.warn('[Store] set failed', e); }
    },
    remove: function (name) {
      try { localStorage.removeItem(this.key(name)); } catch (e) { /* ignore */ }
    }
  };

  /* ---- PremiumManager: free build, always unlocked ---- */
  var PremiumManager = {
    isPro: true,
    has: function () { return true; },
    require: function (featureName) {
      console.log("[PremiumManager] '" + (featureName || 'feature') + "' is free.");
      return true;
    },
    initialize: function () {
      console.log('[PremiumManager] FREE build — all features unlocked.');
    }
  };

  /* ---- AdManager: ads are disabled entirely ---- */
  var AdManager = {
    adsEnabled: false,
    initialize: function () { console.log('[AdManager] Free build — ads disabled.'); },
    showBanner: function () { },
    hideBanner: function () { },
    showInterstitial: function () { console.log('[AdManager] Interstitial skipped (free build).'); },
    showRewarded: function (onReward) { if (onReward) onReward(); } // grant instantly
  };

  /* ---- Localization (English + Hindi) ---- */
  var Localization = (function () {
    var Table = {
      'app.title': ['Chroma Toons', 'क्रोमा टून्स'],
      'home': ['Home', 'होम'],
      'characters': ['Characters', 'कैरेक्टर'],
      'creator': ['Creator', 'क्रिएटर'],
      'animate': ['Animate', 'एनिमेट'],
      'timeline': ['Timeline', 'टाइमलाइन'],
      'recording': ['Recording', 'रिकॉर्डिंग'],
      'gallery': ['Gallery', 'गैलरी'],
      'blog': ['Blog', 'ब्लॉग'],
      'premium': ['Premium', 'प्रीमियम'],
      'settings': ['Settings', 'सेटिंग्स'],
      'help': ['Help & Support', 'हेल्प और सपोर्ट'],
      'create_char': ['Create Character', 'कैरेक्टर बनाएं'],
      'import_char': ['Import Character', 'कैरेक्टर इम्पोर्ट करें'],
      'import_custom': ['Import Custom Animation', 'कस्टम एनिमेशन इम्पोर्ट'],
      'add_char': ['Add Character', 'कैरेक्टर जोड़ें'],
      'character_name': ['Character Name', 'कैरेक्टर का नाम'],
      'screen_record': ['Screen Record', 'स्क्रीन रिकॉर्ड'],
      'screenshot': ['Screenshot', 'स्क्रीनशॉट'],
      'share': ['Share', 'शेयर'],
      'rate_us': ['Rate Us', 'रेट करें'],
      'all_free': ['Everything is free', 'सब कुछ फ्री है'],
      'pro_unlocked': ['Pro unlocked', 'प्रो अनलॉक'],
      'no_internet': ['Connect to the Internet', 'इंटरनेट से कनेक्ट करें'],
      'loading': ['Loading...', 'लोड हो रहा है...'],
      'saved': ['Saved', 'सेव हो गया'],
      'delete': ['Delete', 'डिलीट'],
      'cancel': ['Cancel', 'कैंसिल'],
      'ok': ['OK', 'ठीक है']
    };
    var current = 'en';
    return {
      get lang() { return current; },
      setLang: function (lang) {
        current = lang === 'hi' ? 'hi' : 'en';
        EventBus.emit('lang:changed', current);
      },
      t: function (key) {
        var v = Table[key];
        if (!v) return key;
        return current === 'hi' ? v[1] : v[0];
      }
    };
  })();

  global.ChromaToons = global.ChromaToons || {};
  global.ChromaToons.AppConfig = AppConfig;
  global.ChromaToons.EventBus = EventBus;
  global.ChromaToons.Store = Store;
  global.ChromaToons.PremiumManager = PremiumManager;
  global.ChromaToons.AdManager = AdManager;
  global.ChromaToons.Localization = Localization;
})(window);
