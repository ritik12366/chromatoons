/* ============================================================================
 * ChromaToons.AnimationLib — ready-made animation clips.
 *
 * Each clip is a function of normalised time t (0..1) that returns a partial
 * pose: { boneName: { x, y, rotation, scaleX, scaleY } }. The live loop writes
 * that pose onto AnimationStudio.pose every frame, so built-in clips animate
 * exactly like a hand-keyed timeline without needing any keyframes.
 *
 * Clips can also be "baked" into real keyframes (timeline) via AnimationLib.bake.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var TAU = Math.PI * 2;

  function p(rot) { return { rotation: rot || 0 }; }
  function xy(x, y) { return { x: x || 0, y: y || 0 }; }

  /* ---- clip definitions ---- */
  var CLIPS = [
    {
      id: 'idle',
      label: 'Idle',
      emoji: '🧍',
      fps: 24,
      frames: 48,
      pose: function (t) {
        var s = Math.sin(t * TAU);
        return {
          root: xy(0, s * 0.006),
          chest: p(s * 1.6),
          head: p(s * -2.2),
          armL: p(4 + s * 3),
          armR: p(-4 - s * 3),
          foreArmL: p(6), foreArmR: p(-6),
          mouth: { scaleY: 1 }
        };
      }
    },

    {
      id: 'walk',
      label: 'Walk',
      emoji: '🚶',
      fps: 24,
      frames: 32,
      pose: function (t) {
        var s = Math.sin(t * TAU), c = Math.cos(t * TAU);
        return {
          root: xy(0, Math.abs(s) * -0.012),
          torso: p(s * 2),
          chest: p(s * -1.5),
          head: p(s * 1.5),
          armL: p(-20 * s),
          armR: p(20 * s),
          foreArmL: p(14 + 8 * s),
          foreArmR: p(-14 + 8 * s),
          legL: p(24 * s),
          legR: p(-24 * s),
          shinL: p(Math.max(0, -18 * c)),
          shinR: p(Math.max(0, 18 * c))
        };
      }
    },

    {
      id: 'run',
      label: 'Run',
      emoji: '🏃',
      fps: 24,
      frames: 20,
      pose: function (t) {
        var s = Math.sin(t * TAU), c = Math.cos(t * TAU);
        return {
          root: xy(0, Math.abs(s) * -0.03),
          torso: p(8 + s * 3),
          chest: p(s * -2),
          head: p(-6 + s * 2),
          armL: p(-52 * s), armR: p(52 * s),
          foreArmL: p(46), foreArmR: p(-46),
          legL: p(44 * s), legR: p(-44 * s),
          shinL: p(Math.max(0, -40 * c)),
          shinR: p(Math.max(0, 40 * c))
        };
      }
    },

    {
      id: 'jump',
      label: 'Jump',
      emoji: '🦘',
      fps: 24,
      frames: 36,
      pose: function (t) {
        /* 0-.25 crouch, .25-.7 air, .7-1 land */
        var y, leg, arm, rot = 0;
        if (t < 0.25) {
          var k = t / 0.25;
          y = 0.05 * k; leg = 30 * k; arm = 20 * k;
        } else if (t < 0.7) {
          var a = (t - 0.25) / 0.45;
          y = -0.30 * Math.sin(a * Math.PI);
          leg = 30 - 46 * Math.sin(a * Math.PI);
          arm = 20 - 110 * Math.sin(a * Math.PI);
        } else {
          var l = (t - 0.7) / 0.3;
          y = 0.055 * Math.sin(l * Math.PI);
          leg = 28 * (1 - l); arm = -20 * (1 - l);
        }
        return {
          root: xy(0, y),
          torso: p(rot),
          chest: p(-6),
          head: p(6),
          armL: p(-arm), armR: p(arm),
          foreArmL: p(-20), foreArmR: p(20),
          legL: p(-leg), legR: p(-leg),
          shinL: p(leg * 1.4), shinR: p(leg * 1.4)
        };
      }
    },

    {
      id: 'wave',
      label: 'Wave',
      emoji: '👋',
      fps: 24,
      frames: 32,
      pose: function (t) {
        var s = Math.sin(t * TAU * 2);
        return {
          chest: p(-2),
          head: p(-3 + s * 2),
          armR: p(-150 + s * 10),
          foreArmR: p(-24 + s * 28),
          armL: p(6),
          mouth: { scaleY: 1.3 }
        };
      }
    },

    {
      id: 'dance',
      label: 'Dance',
      emoji: '💃',
      fps: 24,
      frames: 48,
      pose: function (t) {
        var s = Math.sin(t * TAU), c2 = Math.cos(t * TAU * 2);
        return {
          root: xy(s * 0.02, Math.abs(c2) * -0.012),
          torso: p(s * 8),
          chest: p(c2 * 5),
          head: p(-s * 10),
          armL: p(-40 + s * 55),
          armR: p(40 + s * 55),
          foreArmL: p(30 + c2 * 35),
          foreArmR: p(-30 + c2 * 35),
          legL: p(s * 12),
          legR: p(-s * 12),
          shinL: p(Math.abs(c2) * 14),
          shinR: p(Math.abs(c2) * 14)
        };
      }
    },

    {
      id: 'talk',
      label: 'Talk',
      emoji: '🗣️',
      fps: 24,
      frames: 36,
      pose: function (t) {
        var s = Math.sin(t * TAU * 3), slow = Math.sin(t * TAU);
        return {
          head: p(slow * 3),
          chest: p(slow * 1.5),
          armL: p(-10 + s * 6),
          armR: p(10 - s * 6),
          foreArmL: p(24 + s * 10),
          foreArmR: p(-24 + s * 10),
          mouth: { scaleY: 0.55 + Math.abs(s) * 1.5 }
        };
      }
    },

    {
      id: 'punch',
      label: 'Punch',
      emoji: '🥊',
      fps: 24,
      frames: 24,
      pose: function (t) {
        /* fast out, slow back */
        var out = t < 0.35 ? (t / 0.35) : Math.max(0, 1 - (t - 0.35) / 0.65);
        return {
          torso: p(-out * 10),
          chest: p(-out * 6),
          head: p(out * 6),
          armR: p(-out * 88),
          foreArmR: p(out * 78 - 10),
          armL: p(14),
          foreArmL: p(30),
          root: xy(-out * 0.01, 0)
        };
      }
    },

    {
      id: 'kick',
      label: 'Kick',
      emoji: '🦵',
      fps: 24,
      frames: 26,
      pose: function (t) {
        var out = t < 0.4 ? (t / 0.4) : Math.max(0, 1 - (t - 0.4) / 0.6);
        return {
          torso: p(-out * 8),
          legR: p(-out * 85),
          shinR: p(out * 20),
          legL: p(out * 6),
          armL: p(-out * 40),
          armR: p(out * 40),
          root: xy(0, -out * 0.01)
        };
      }
    },

    {
      id: 'anger',
      label: 'Angry',
      emoji: '😠',
      fps: 24,
      frames: 30,
      pose: function (t) {
        var shake = Math.sin(t * TAU * 6) * 1.6;
        return {
          root: xy(shake * 0.002, 0),
          head: p(shake * 3),
          torso: p(4),
          chest: p(3),
          armL: p(-20), armR: p(20),
          foreArmL: p(50), foreArmR: p(-50),
          mouth: { scaleY: 0.6 }
        };
      }
    },

    {
      id: 'sleep',
      label: 'Sleep',
      emoji: '😴',
      fps: 24,
      frames: 72,
      pose: function (t) {
        var b = Math.sin(t * TAU);
        return {
          head: p(16 + b * 2),
          chest: p(4 + b * 1.5),
          torso: p(3),
          armL: p(8), armR: p(-8),
          foreArmL: p(18), foreArmR: p(-18),
          mouth: { scaleY: 0.4 }
        };
      }
    }
  ];

  var byId = {};
  CLIPS.forEach(function (c) { byId[c.id] = c; });

  var AnimationLib = {
    clips: CLIPS,

    get: function (id) { return byId[id] || null; },

    /* Is a clip currently driving the live pose? */
    active: null,
    _phase: 0,
    _base: null,

    start: function (id) {
      var clip = byId[id];
      if (!clip) return false;
      /* remember the pose the user had, so Stop puts it back */
      this._base = JSON.parse(JSON.stringify(C.AnimationStudio.pose || {}));
      this.active = clip;
      this._phase = 0;
      C.EventBus.emit('animlib:start', clip);
      return true;
    },

    stop: function () {
      if (!this.active) return;
      if (this._base) {
        var pose = C.AnimationStudio.pose;
        var base = this._base;
        Object.keys(base).forEach(function (b) {
          var src = base[b], dst = pose[b] || (pose[b] = C.defaultPose());
          dst.x = src.x || 0;
          dst.y = src.y || 0;
          dst.rotation = src.rotation || 0;
          dst.scaleX = src.scaleX == null ? 1 : src.scaleX;
          dst.scaleY = src.scaleY == null ? 1 : src.scaleY;
        });
      }
      this._base = null;
      this.active = null;
      C.EventBus.emit('animlib:stop');
    },

    /* Called by the render loop; advance + apply to the live pose. */
    step: function (deltaSeconds) {
      if (!this.active) return false;
      var clip = this.active;
      var dur = clip.frames / clip.fps;
      this._phase = (this._phase + deltaSeconds / dur) % 1;
      /* start from the pose the clip began with, then add the clip on top */
      var pose = C.AnimationStudio.pose;
      var base = this._base;
      if (base) {
        Object.keys(base).forEach(function (b) {
          var src = base[b], dst = pose[b] || (pose[b] = C.defaultPose());
          dst.x = src.x || 0;
          dst.y = src.y || 0;
          dst.rotation = src.rotation || 0;
          dst.scaleX = src.scaleX == null ? 1 : src.scaleX;
          dst.scaleY = src.scaleY == null ? 1 : src.scaleY;
        });
      }
      this.apply(clip.pose(this._phase));
      return true;
    },

    apply: function (partial) {
      var pose = C.AnimationStudio.pose;
      Object.keys(partial || {}).forEach(function (bone) {
        var base = pose[bone] || (pose[bone] = C.defaultPose());
        var d = partial[bone];
        Object.keys(d).forEach(function (k) {
          if (k === 'x' || k === 'y' || k === 'rotation') base[k] = (base[k] || 0) + (d[k] || 0);
          else base[k] = d[k];
        });
      });
    },

    /* ---- bake a clip into real timeline keyframes ---- */
    bake: function (id, opts) {
      var clip = byId[id];
      if (!clip) return 0;
      opts = opts || {};
      var studio = C.AnimationStudio;
      var steps = opts.steps || Math.max(2, Math.round(clip.frames / 4));
      var startFrame = opts.startFrame == null ? 0 : opts.startFrame;
      var easing = opts.easing || 'easeInOut';

      /* Stop the live clip first so the render loop stops writing to the pose
         while we are sampling (otherwise it would fight the keyframes). */
      if (this.active && this.active.id === id) this.stop();

      var savedFrame = studio.currentFrame;
      var savedPose = JSON.parse(JSON.stringify(studio.pose || {}));

      for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        C.BONES.forEach(function (b) { studio.pose[b] = C.defaultPose(); });
        AnimationLib.apply(clip.pose(t));
        studio.currentFrame = startFrame + Math.round(t * clip.frames);
        studio.addKeyframe(easing);
      }

      studio.currentFrame = savedFrame;
      C.BONES.forEach(function (b) {
        studio.pose[b] = savedPose[b] ? JSON.parse(JSON.stringify(savedPose[b])) : C.defaultPose();
      });
      studio.setDuration(Math.max(studio.project.durationFrames,
        startFrame + clip.frames));
      C.EventBus.emit('studio:project', studio.project);
      return steps + 1;
    }
  };

  C.AnimationLib = AnimationLib;
})(window);
