/* Home panel — replaces UI/Panels/HomePanel.cs */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  function go(id) { return function () { C.Panels.show(id); }; }

  C.Panels.register({
    id: 'home',
    title: 'Home',
    navLabel: 'Home',
    icon: '🏠',

    render: function (el) {
      el.appendChild(h('div', { class: 'hero' }, [
        h('div', { class: 'hero__title', text: 'Create • Animate • Record' }),
        h('div', { class: 'hero__sub', text: '2D character animation studio' })
      ]));

      el.appendChild(C.UI.sectionTitle('Quick Actions'));
      el.appendChild(C.UI.grid([
        C.UI.button('Create Character', 'btn--accent', go('creator')),
        C.UI.button('My Characters', '', go('characters')),
        C.UI.button('Animate', 'btn--accent2', go('animate')),
        C.UI.button('Timeline', '', go('timeline')),
        C.UI.button('Screen Record', 'btn--danger', go('recording')),
        C.UI.button('Gallery', '', go('gallery'))
      ], 2));

      el.appendChild(C.UI.sectionTitle('More'));
      el.appendChild(C.UI.grid([
        C.UI.button('Character Blog', '', go('blog')),
        C.UI.button('Premium', '', go('premium')),
        C.UI.button('Help & Support', '', go('help')),
        C.UI.button('Settings', '', go('settings'))
      ], 2));

      el.appendChild(h('div', { class: 'card center' },
        h('b', { text: 'All Pro features are free in this build 🎉' })));
    }
  });
})(window);
