/* ============================================================================
 * ChromaToons.Animator — canvas renderer for the rig + the placed scene.
 * Replaces the rendering half of the old Rigging/CameraRig code (no engine).
 * The rig is a proper parent->child hierarchy so moving a bone moves its limbs.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  /* Rest layout (fractions of half-stage) + parent for each bone. */
  var BONE_DEFS = {
    root:     { x: 0.00, y: 0.35, parent: null },
    torso:    { x: 0.00, y: -0.22, parent: 'root' },
    hip:      { x: 0.00, y: 0.02, parent: 'root' },
    chest:    { x: 0.00, y: -0.42, parent: 'torso' },
    neck:     { x: 0.00, y: -0.16, parent: 'chest' },
    head:     { x: 0.00, y: -0.30, parent: 'neck' },
    armL:     { x: -0.26, y: -0.02, parent: 'chest' },
    foreArmL: { x: -0.28, y: 0.34, parent: 'armL' },
    armR:     { x: 0.26, y: -0.02, parent: 'chest' },
    foreArmR: { x: 0.28, y: 0.34, parent: 'armR' },
    legL:     { x: -0.13, y: 0.06, parent: 'root' },
    shinL:    { x: -0.02, y: 0.68, parent: 'legL' },
    legR:     { x: 0.13, y: 0.06, parent: 'root' },
    shinR:    { x: 0.02, y: 0.68, parent: 'legR' },
    mouth:    { x: 0.00, y: 0.10, parent: 'head' },
    eyeL:     { x: -0.09, y: -0.02, parent: 'head' },
    eyeR:     { x: 0.09, y: -0.02, parent: 'head' }
  };

  var SEGMENTS = [
    ['root', 'torso'], ['torso', 'chest'], ['chest', 'neck'], ['neck', 'head'],
    ['chest', 'armL'], ['armL', 'foreArmL'],
    ['chest', 'armR'], ['armR', 'foreArmR'],
    ['root', 'legL'], ['legL', 'shinL'],
    ['root', 'legR'], ['legR', 'shinR']
  ];

  var LAYOUT = {};
  Object.keys(BONE_DEFS).forEach(function (k) { LAYOUT[k] = { x: BONE_DEFS[k].x, y: BONE_DEFS[k].y }; });

  function create(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var imgCache = {};
    var dpr = Math.min(global.devicePixelRatio || 1, 2.5);
    var state = {
      bg: opts.bg || '#20242f',
      showGrid: opts.showGrid !== false,
      showRig: opts.showRig !== false,
      showHandles: !!opts.showHandles
    };
    var studio = C.AnimationStudio;

    function ensureSize() {
      var cssW = canvas.clientWidth || (canvas.parentNode && canvas.parentNode.clientWidth) || 320;
      var cssH = Math.round(cssW * 1.15);
      var w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        canvas.style.height = cssH + 'px';
      }
    }
    function unit() { return Math.min(canvas.width, canvas.height) * 0.28; }
    function center() { return { x: canvas.width / 2, y: canvas.height / 2 }; }

    /* ---- hierarchy: bone -> world transform (layout units) ---- */
    function worldTransforms(pose) {
      var out = {};
      function compute(name) {
        if (out[name]) return out[name];
        var def = BONE_DEFS[name];
        var p = (pose && pose[name]) || {};
        var localTx = def.x + (p.x || 0);
        var localTy = def.y + (p.y || 0);
        var localRot = (p.rotation || 0) * Math.PI / 180;
        var lsx = p.scaleX == null ? 1 : p.scaleX;
        var lsy = p.scaleY == null ? 1 : p.scaleY;
        if (def.parent == null) {
          out[name] = { tx: localTx, ty: localTy, rot: localRot, sx: lsx, sy: lsy };
          return out[name];
        }
        var pw = compute(def.parent);
        var c = Math.cos(pw.rot), s = Math.sin(pw.rot);
        out[name] = {
          tx: pw.tx + (c * localTx - s * localTy) * pw.sx,
          ty: pw.ty + (s * localTx + c * localTy) * pw.sy,
          rot: pw.rot + localRot,
          sx: pw.sx * lsx,
          sy: pw.sy * lsy
        };
        return out[name];
      }
      Object.keys(BONE_DEFS).forEach(compute);
      return out;
    }

    function jointPositions(pose) {
      var w = worldTransforms(pose);
      var c = center(), u = unit(), out = {};
      Object.keys(w).forEach(function (name) {
        out[name] = { x: c.x + w[name].tx * u, y: c.y + w[name].ty * u };
      });
      return out;
    }

    function drawImageForScene() {
      var Scene = C.Scene, CharacterStore = C.CharacterStore;
      if (!Scene || !CharacterStore) return;
      Scene.get().forEach(function (entry) {
        var ch = CharacterStore.get(entry.characterId);
        if (!ch || !ch.sprite) return;
        var img = imgCache[ch.id];
        if (!img) {
          img = new Image();
          img.onload = function () { render(); };
          img.src = ch.sprite;
          imgCache[ch.id] = img;
        }
        if (!img.complete || !img.naturalWidth) return;
        var scale = entry.scale || 1;
        var iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
        var fit = (canvas.height * 0.7) / ih;
        iw *= fit; ih *= fit;
        var x = entry.x * canvas.width, y = entry.y * canvas.height;
        ctx.save();
        ctx.translate(x, y);
        if (entry.flipX) ctx.scale(-1, 1);
        if (entry.rotation) ctx.rotate(entry.rotation * Math.PI / 180);
        ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
        ctx.restore();
      });
    }

    function drawRig(pose) {
      var j = jointPositions(pose);
      var u = unit();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      SEGMENTS.forEach(function (seg) {
        var a = j[seg[0]], b = j[seg[1]];
        var limb = /arm|leg|shin|foreArm/.test(seg[0] + seg[1]);
        ctx.strokeStyle = limb ? '#4cc2ff' : '#ff6b35';
        ctx.lineWidth = u * (seg[0] === 'root' && seg[1] === 'torso' ? 0.2 : 0.14);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });

      var head = j.head;
      var r = u * 0.24;
      ctx.fillStyle = '#262b3a';
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = u * 0.05;
      ctx.beginPath(); ctx.arc(head.x, head.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#f2f4f8';
      [j.eyeL, j.eyeR].forEach(function (e) {
        ctx.beginPath(); ctx.arc(e.x, e.y, u * 0.035, 0, Math.PI * 2); ctx.fill();
      });

      var mouthPose = (pose && pose.mouth) || {};
      var mouthH = Math.max(u * 0.04, u * 0.06 * (mouthPose.scaleY || 1));
      ctx.fillStyle = '#e53935';
      ctx.beginPath(); ctx.ellipse(j.mouth.x, j.mouth.y, u * 0.11, mouthH, 0, 0, Math.PI * 2); ctx.fill();
    }

    function drawHandles(pose) {
      if (!state.showHandles) return;
      var j = jointPositions(pose);
      var u = unit();
      ctx.fillStyle = 'rgba(76,194,255,0.9)';
      ctx.strokeStyle = '#f2f4f8';
      ctx.lineWidth = Math.max(1, u * 0.015);
      Object.keys(j).forEach(function (name) {
        var p = j[name], s = u * 0.06;
        ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
      });
    }

    function drawGrid() {
      if (!state.showGrid) return;
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      var step = canvas.width / 8;
      for (var x = step; x < canvas.width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (var y = step; y < canvas.height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    }

    function render(pose) {
      ensureSize();
      if (pose == null) pose = studio && studio.pose;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = state.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      drawImageForScene();
      if (state.showRig) drawRig(pose);
      drawHandles(pose);
    }

    function nearestBone(clientX, clientY, pose) {
      var rect = canvas.getBoundingClientRect();
      var sx = canvas.width / rect.width, sy = canvas.height / rect.height;
      var px = (clientX - rect.left) * sx, py = (clientY - rect.top) * sy;
      var j = jointPositions(pose);
      var best = null, bestD = Infinity;
      Object.keys(j).forEach(function (name) {
        var dx = j[name].x - px, dy = j[name].y - py;
        var d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = name; }
      });
      return { bone: best, dist: Math.sqrt(bestD), pixels: { x: px, y: py }, scale: sx };
    }

    function toFraction(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
    }

    function poseToUnits(dxClient, dyClient) {
      var rect = canvas.getBoundingClientRect();
      return { x: dxClient / rect.width * (canvas.width / unit()), y: dyClient / rect.height * (canvas.height / unit()) };
    }

    return {
      state: state,
      render: render,
      nearestBone: nearestBone,
      toFraction: toFraction,
      poseToUnits: poseToUnits,
      jointPositions: jointPositions,
      invalidateImages: function () { imgCache = {}; }
    };
  }

  C.Animator = { create: create, BONE_DEFS: BONE_DEFS, SEGMENTS: SEGMENTS, LAYOUT: LAYOUT };
})(window);
