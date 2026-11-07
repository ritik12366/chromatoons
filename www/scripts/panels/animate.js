/* Animate panel — pose the rig with drag + IK (replaces the old "Add Avatarz"
 * / BestBoneT editing screen). Adds keyframes at the current frame. */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  function render(el) {
    var stage = C.Stage.create({ showRig: true, showHandles: true });
    el.appendChild(stage.root);

    var status = h('div', { class: 'muted', text: 'Drag a joint to move it. Tap a joint to select.' });
    status.style.margin = '8px 0';
    el.appendChild(status);

    /* ---- ready-made animations ---- */
    el.appendChild(C.UI.sectionTitle('Animations'));
    var clipRow = h('div', { class: 'chip-row' });
    if (C.AnimationLib) {
      C.AnimationLib.clips.forEach(function (clip) {
        clipRow.appendChild(C.UI.chip((clip.emoji || '') + ' ' + clip.label, false, function () {
          if (C.AnimationLib.active && C.AnimationLib.active.id === clip.id) {
            C.AnimationLib.stop();
            C.EventBus.emit('toast', 'Stopped ' + clip.label);
            paintClips();
            return;
          }
          C.AnimationLib.start(clip.id);
          C.EventBus.emit('toast', 'Playing ' + clip.label);
          paintClips();
        }));
      });
    }
    el.appendChild(clipRow);
    el.appendChild(C.UI.row([
      C.UI.button('Stop Animation', '', function () {
        if (C.AnimationLib) C.AnimationLib.stop();
        paintClips();
      }),
      C.UI.button('Bake To Keyframes', 'btn--accent2', function () {
        if (!C.AnimationLib || !C.AnimationLib.active) {
          C.EventBus.emit('toast', 'Play an animation first');
          return;
        }
        var id = C.AnimationLib.active.id;
        var n = C.AnimationLib.bake(id);
        C.AnimationLib.stop();
        C.EventBus.emit('toast', 'Baked ' + n + ' keyframes → Timeline');
        paintClips();
      })
    ]));

    function paintClips() {
      var activeId = C.AnimationLib && C.AnimationLib.active ? C.AnimationLib.active.id : null;
      Array.prototype.slice.call(clipRow.children).forEach(function (chip, i) {
        chip.classList.toggle('is-on', C.AnimationLib.clips[i].id === activeId);
      });
    }
    paintClips();

    var pose = C.AnimationStudio.pose;
    var selected = 'torso';
    var drag = null;

    var boneChips = h('div', { class: 'chip-row' });
    el.appendChild(boneChips);
    buildChips();

    el.appendChild(C.UI.row([
      C.UI.button('Add Keyframe', 'btn--accent', function () {
        var f = C.AnimationStudio.addKeyframe();
        C.EventBus.emit('toast', 'Keyframe @ ' + f);
      }),
      C.UI.button('Reset Pose', '', function () {
        if (C.AnimationLib && C.AnimationLib.active) { C.AnimationLib.stop(); paintClips(); }
        C.BONES.forEach(function (b) { C.AnimationStudio.pose[b] = C.defaultPose(); });
        C.EventBus.emit('toast', 'Pose reset');
      })
    ]));

    el.appendChild(C.UI.row([
      C.UI.button('Play/Pause', 'btn--accent2', function () { C.AnimationStudio.togglePlay(); }),
      C.UI.button('Stop', '', function () { C.AnimationStudio.stop(); }),
      C.UI.button('Timeline →', '', function () { C.Panels.show('timeline'); })
    ]));

    /* --- slider controls --- */
    el.appendChild(C.UI.sectionTitle('Selected Bone'));
    var sx = slider('X', -1, 1, 0.01, function (v) { moveSel('x', v); });
    var sy = slider('Y', -1, 1, 0.01, function (v) { moveSel('y', v); });
    var ro = slider('Rotation°', -180, 180, 1, function (v) { moveSel('rotation', v); });
    var sc = slider('Scale', 0.4, 2, 0.01, function (v) { moveSel('scaleX', v); moveSel('scaleY', v); });
    [sx.el, sy.el, ro.el, sc.el].forEach(function (s) { el.appendChild(s); });

    /* --- IK --- */
    el.appendChild(C.UI.sectionTitle('IK'));
    el.appendChild(C.UI.row([
      C.UI.button('Reach Left Hand', '', function () { ikTo('foreArmL'); }),
      C.UI.button('Reach Right Hand', '', function () { ikTo('foreArmR'); })
    ]));

    /* --- effects --- */
    el.appendChild(C.UI.sectionTitle('Effects'));
    var effectChips = h('div', { class: 'chip-row' });
    C.Effects.kinds.forEach(function (k) {
      effectChips.appendChild(C.UI.chip(k.label, C.Effects.current === k.id, function () {
        C.Effects.set(k.id);
        stage.setEffects(k.id !== 'none');
        buildEffectChips();
      }));
    });
    el.appendChild(effectChips);
    function buildEffectChips() {
      Array.prototype.slice.call(effectChips.children).forEach(function (chip, i) {
        chip.classList.toggle('is-on', C.Effects.kinds[i].id === C.Effects.current);
      });
    }

    el.appendChild(C.UI.sectionTitle('Lip Sync'));
    var muteBtn = C.UI.button('Start Mic Lip Sync', 'btn--accent2', function () {
      C.Audio.start().then(function () {
        C.EventBus.emit('toast', 'Mic on — talk to move the mouth');
      }).catch(function (e) { C.EventBus.emit('toast', 'Mic blocked: ' + e.message); });
    });
    el.appendChild(C.UI.row([
      muteBtn,
      C.UI.button('Stop Mic', '', function () { C.Audio.stop(); C.EventBus.emit('toast', 'Mic off'); })
    ]));

    /* --- drag handling --- */
    var canvas = stage.canvas;
    canvas.addEventListener('pointerdown', function (e) {
      var hit = stage.animator.nearestBone(e.clientX, e.clientY, pose);
      if (!hit.bone) return;
      /* manual posing takes over from a running clip */
      if (C.AnimationLib && C.AnimationLib.active) { C.AnimationLib.stop(); paintClips(); }
      selected = hit.bone;
      drag = { bone: hit.bone, last: { x: e.clientX, y: e.clientY } };
      buildChips();
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.last.x;
      var dy = e.clientY - drag.last.y;
      drag.last = { x: e.clientX, y: e.clientY };
      var units = stage.animator.poseToUnits(dx, dy);
      var p = pose[drag.bone] || (pose[drag.bone] = C.defaultPose());
      p.x += units.x;
      p.y += units.y;
      syncSliders();
      status.textContent = drag.bone + '  x=' + p.x.toFixed(2) + '  y=' + p.y.toFixed(2);
    });
    canvas.addEventListener('pointerup', function () { drag = null; });
    canvas.addEventListener('pointercancel', function () { drag = null; });

    function moveSel(prop, value) {
      var p = pose[selected] || (pose[selected] = C.defaultPose());
      p[prop] = value;
      stage.render();
      status.textContent = selected + '  ' + prop + ' = ' + value;
    }

    function syncSliders() {
      var p = pose[selected] || C.defaultPose();
      sx.set(p.x, true);
      sy.set(p.y, true);
      ro.set(p.rotation, true);
      sc.set(p.scaleX, true);
    }

    function buildChips() {
      boneChips.innerHTML = '';
      C.BONES.forEach(function (b) {
        boneChips.appendChild(C.UI.chip(b, b === selected, function () {
          selected = b;
          buildChips();
          syncSliders();
          status.textContent = 'Selected: ' + b;
        }));
      });
      syncSliders();
    }

    function ikTo(tipBone) {
      var chainBones = tipBone === 'foreArmL'
        ? ['armL', 'foreArmL'] : ['armR', 'foreArmR'];
      var root = chainBones[0], mid = chainBones[1];
      /* target = mid rest point of the same side, so IK visibly reaches out */
      var target = C.Animator.LAYOUT[mid];
      target = { x: target.x * 1.15, y: target.y * 0.6 };
      var rootPos = C.Animator.LAYOUT[root];
      var solved = C.Rigging.solveTwoBone(rootPos, C.Animator.LAYOUT[mid], target, target);
      var p = pose[root] || (pose[root] = C.defaultPose());
      p.rotation = solved.rootRotation;
      C.EventBus.emit('toast', 'IK solved (' + root + ')');
      stage.render();
    }

    stage.render();
  }

  function slider(label, min, max, step, onChange) {
    var input = h('input', { type: 'range', min: min, max: max, step: step, value: 0 });
    var wrap = h('div', [C.UI.fieldLabel(label), input]);
    input.addEventListener('input', function () { onChange(parseFloat(input.value)); });
    return {
      el: wrap,
      set: function (v, silent) { input.value = v; if (!silent) onChange(v); }
    };
  }

  C.Panels.register({
    id: 'animate',
    title: 'Animate',
    navLabel: 'Animate',
    icon: '🕺',
    render: render
  });
})(window);
