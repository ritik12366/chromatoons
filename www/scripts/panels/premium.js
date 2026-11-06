/* Premium panel — replaces UI/Panels/PremiumPanel.cs. Nothing to buy. */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  var FEATURES = [
    'Unlimited characters',
    'Import custom characters & animations',
    'Full pose & IK rig editor',
    'Keyframe timeline with save / export',
    'Pro screen recorder (all qualities, no limit)',
    'Recording gallery',
    'Camera effects & themes',
    'No ads',
    'No watermark'
  ];

  C.Panels.register({
    id: 'premium',
    title: 'Premium',
    navLabel: 'Premium',
    icon: '⭐',
    render: function (el) {
      var hero = h('div', { class: 'hero', style: { background: 'var(--accent)' } },
        h('div', { class: 'hero__title', text: '🎉 ALL PRO FEATURES ARE FREE' }));
      el.appendChild(hero);

      FEATURES.forEach(function (f) {
        el.appendChild(h('div', { class: 'card' }, h('b', { style: { color: 'var(--success)' }, text: '✔  ' + f })));
      });

      el.appendChild(h('div', { class: 'card center muted', text: 'Nothing to purchase — enjoy the app!' }));
    }
  });
})(window);
