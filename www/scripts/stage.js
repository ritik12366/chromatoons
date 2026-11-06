/* ============================================================================
 * ChromaToons.Stage — reusable canvas "viewport" with rig rendering, effects
 * overlay and camera transform. Shared by the Creator / Animate / Recording
 * panels (the old build showed this inside its Unity scene).
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  function create(opts) {
    opts = opts || {};
    var canvas = h('canvas');
    var overlay = h('div', { class: 'stage__overlay' });
    var badge = h('span', { class: 'badge', text: '● REC' });
    var root = h('div', { class: 'stage' }, [canvas, overlay, badge]);

    var animator = C.Animator.create(canvas, {
      bg: '#20242f',
      showGrid: true,
      showRig: opts.showRig !== false,
      showHandles: !!opts.showHandles
    });
    C.Camera.attach(canvas);
    var effectsOn = false;

    function applyEffects() {
      if (!effectsOn) { canvas.style.filter = 'none'; overlay.style.background = 'none'; return; }
      var s = C.Effects.style();
      canvas.style.filter = s.filter;
      overlay.style.background = s.overlay;
    }

    root.__render = function () { animator.render(); };
    animator.render();

    C.AnimationStudio.onUpdate(function () { animator.render(); });
    if (C.Effects) C.EventBus.on('effects:changed', applyEffects);

    return {
      root: root,
      canvas: canvas,
      animator: animator,
      setEffects: function (on) { effectsOn = !!on; applyEffects(); },
      setCamera: function (on) { if (!on) C.Camera.reset(); },
      setBadge: function (on) { badge.classList.toggle('is-on', !!on); },
      setHandles: function (on) { animator.state.showHandles = !!on; animator.render(); },
      render: function () { animator.render(); }
    };
  }

  C.Stage = { create: create };
})(window);
