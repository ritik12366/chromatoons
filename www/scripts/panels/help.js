/* Help panel — replaces UI/Panels/HelpPanel.cs */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;
  var cfg = C.AppConfig;

  var ARTICLES = [
    ['How do I create a character?',
      'Open the Characters tab, type a name and tap Add, or tap Import to pick an image. Then open the Creator to place it in the scene.'],
    ['How do I animate?',
      'Open Animate, drag the joints (or use the sliders), then tap Add Keyframe. Move to another frame and pose again — the Timeline plays it back.'],
    ['How do I use the timeline?',
      'Timeline lets you scrub, jump between keyframes, change duration and frame rate, save named projects and export the project as JSON.'],
    ['How do I use IK?',
      'In Animate, tap Reach Left/Right Hand to solve the two-bone IK on an arm, then keyframe the result.'],
    ['How do I do lip sync?',
      'In Animate, tap Start Mic Lip Sync and talk — the mouth opens with your voice.'],
    ['How do I record the screen?',
      'Recording tab ▸ choose quality ▸ Start Recording. Everything is unlocked; screenshots always work.'],
    ['Where are my recordings?',
      'Gallery lists every video and screenshot.'],
    ['Ads or payments?',
      'None. This free build has no ads and nothing to buy.']
  ];

  C.Panels.register({
    id: 'help',
    title: 'Help',
    navLabel: 'Help',
    icon: '❓',
    render: function (el) {
      el.appendChild(h('b', { text: 'Help & Support' }));
      ARTICLES.forEach(function (a) {
        el.appendChild(h('div', { class: 'card' }, [
          h('b', { style: { color: 'var(--accent)' }, text: a[0] }),
          h('div', { class: 'muted', style: { marginTop: '6px' }, text: a[1] })
        ]));
      });
      el.appendChild(C.UI.button('Contact us on Telegram', 'btn--accent btn--block', function () {
        global.open(cfg.telegramUrl, '_blank');
      }));
      el.appendChild(C.UI.button('Open Website', 'btn--block', function () { global.open(cfg.siteUrl, '_blank'); }));
    }
  });
})(window);
