/* ============================================================================
 * ChromaToons.Rigging — bone map + two-bone IK + look-at / pin helpers.
 * Replaces Rigging/BoneController.cs and Rigging/IKController.cs.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  var Rigging = {
    /* Bind a flat bone name -> world layout position (fraction of stage). */
    bind: function () {
      var map = {};
      Object.keys(C.Animator.LAYOUT).forEach(function (name) {
        var p = C.Animator.LAYOUT[name];
        map[name] = { x: p.x, y: p.y };
      });
      return map;
    },

    /*
     * Two-bone inverse kinematics. Given root/mid/tip layout points and a target
     * (all in stage fractions) return the rotations (degrees) to reach it.
     * Mirrors the geometry of IKController.cs Solve().
     */
    solveTwoBone: function (root, mid, tip, target) {
      var upperLen = dist(root, mid);
      var lowerLen = dist(mid, tip);
      var toTarget = { x: target.x - root.x, y: target.y - root.y };
      var d = Math.min(mag(toTarget), upperLen + lowerLen - 1e-5);
      d = Math.max(d, 1e-5);
      var cosA = clamp((upperLen * upperLen + d * d - lowerLen * lowerLen) / (2 * upperLen * d), -1, 1);
      var a = Math.acos(cosA); // angle at root between chain and target
      var targetAngle = Math.atan2(toTarget.y, toTarget.x);
      var rootAngle = targetAngle - a;
      var midPos = { x: root.x + Math.cos(rootAngle) * upperLen, y: root.y + Math.sin(rootAngle) * upperLen };
      var tipAngle = Math.atan2(target.y - midPos.y, target.x - midPos.x);
      return {
        rootRotation: rad2deg(rootAngle),
        midRotation: rad2deg(tipAngle),
        mid: midPos
      };
    },

    /* Point a bone's "child" toward a target -> rotation in degrees. */
    lookAt: function (bone, child, target) {
      var angle = Math.atan2(target.y - bone.y, target.x - bone.x);
      var rest = Math.atan2(child.y - bone.y, child.x - bone.x);
      return rad2deg(angle - rest);
    },

    /* n-bone chain (arms/legs) simple CCD solve, returns per-bone rotations. */
    ccd: function (chain, target, iterations) {
      iterations = iterations || 8;
      var pts = chain.map(function (p) { return { x: p.x, y: p.y }; });
      var rots = chain.map(function () { return 0; });
      var base = chain.map(function (p) { return { x: p.x, y: p.y }; });
      for (var it = 0; it < iterations; it++) {
        for (var i = pts.length - 2; i >= 0; i--) {
          var end = pts[pts.length - 1];
          var a1 = Math.atan2(end.y - pts[i].y, end.x - pts[i].x);
          var a2 = Math.atan2(target.y - pts[i].y, target.x - pts[i].x);
          var da = a2 - a1;
          for (var j = i; j < pts.length; j++) {
            var rel = { x: pts[j].x - pts[i].x, y: pts[j].y - pts[i].y };
            var ca = Math.cos(da), sa = Math.sin(da);
            pts[j] = { x: pts[i].x + rel.x * ca - rel.y * sa, y: pts[i].y + rel.x * sa + rel.y * ca };
            if (j < pts.length) rots[j] += da;
          }
        }
      }
      return {
        points: pts,
        rotations: rots.map(function (r) { return rad2deg(r); }),
        restRotations: base.map(function (b, i) {
          return rad2deg(Math.atan2(b.y - base[0].y, b.x - base[0].x));
        })
      };
    }
  };

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function mag(v) { return Math.hypot(v.x, v.y); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rad2deg(r) { return r * 180 / Math.PI; }

  C.Rigging = Rigging;
})(window);
