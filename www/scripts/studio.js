/* ============================================================================
 * ChromaToons.Animation.AnimationStudio
 * Replaces Animation/AnimationStudio.cs + AnimationData.cs.
 * Holds the keyframe project, the playback clock and an interpolation engine.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var EventBus = C.EventBus;

  var BONES = [
    'root', 'hip', 'torso', 'chest', 'neck', 'head',
    'armL', 'foreArmL', 'armR', 'foreArmR',
    'legL', 'shinL', 'legR', 'shinR',
    'mouth', 'eyeL', 'eyeR'
  ];

  function defaultPose() {
    return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  }

  var EASINGS = {
    linear: function (t) { return t; },
    easeIn: function (t) { return t * t; },
    easeOut: function (t) { return 1 - (1 - t) * (1 - t); },
    easeInOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    step: function () { return 0; }
  };

  var AnimationStudio = {
    project: null,
    pose: null,          // live editable pose (bone -> {x,y,rotation,scaleX,scaleY})
    currentFrame: 0,
    isPlaying: false,
    _last: 0,
    _raf: 0,
    _listeners: [],

    init: function () {
      this.pose = this.pose || {};
      BONES.forEach(function (b) {
        if (!AnimationStudio.pose[b]) AnimationStudio.pose[b] = defaultPose();
      });
      if (!this.project) this.createEmptyRig();
      var self = this;
      this._tick = function (ts) { self._frame(ts); };
      this._raf = requestAnimationFrame(this._tick);
    },

    /* ---- clock ---- */
    _frame: function (ts) {
      var delta = this._last ? (ts - this._last) / 1000 : 0;
      this._last = ts;
      if (this.isPlaying && this.project.durationFrames > 0) {
        this.currentFrame += delta * this.project.frameRate;
        if (this.currentFrame >= this.project.durationFrames) {
          if (this.project.loop) this.currentFrame = this.currentFrame % this.project.durationFrames;
          else { this.currentFrame = this.project.durationFrames; this.isPlaying = false; }
        }
      }
      this._renderPose();
      /* a ready-made clip overrides the pose while it is playing */
      if (C.AnimationLib && C.AnimationLib.active) {
        C.AnimationLib.step(Math.min(delta, 0.1));
      }
      this._notify();
      this._raf = requestAnimationFrame(this._tick);
    },

    onUpdate: function (fn) {
      this._listeners.push(fn);
      var self = this;
      return function () {
        var i = self._listeners.indexOf(fn);
        if (i >= 0) self._listeners.splice(i, 1);
      };
    },
    _notify: function () {
      var self = this;
      this._listeners.slice().forEach(function (fn) {
        try { fn(self); } catch (e) { console.error('[AnimationStudio]', e); }
      });
    },

    /* ---- interpolation: fill this.pose from keyframes at currentFrame ---- */
    _renderPose: function () {
      var self = this;
      var evaluated = {};
      var hasAnyKey = false;
      (this.project.tracks || []).forEach(function (track) {
        if (track.muted || !track.keys || track.keys.length === 0) return;
        hasAnyKey = true;
        evaluated[track.name] = self._sampleTrack(track, self.currentFrame);
      });
      if (!hasAnyKey) return; // keep the manual pose (scratch editing)
      BONES.forEach(function (b) {
        if (evaluated[b]) self.pose[b] = evaluated[b];
      });
    },

    _sampleTrack: function (track, frame) {
      var keys = track.keys;
      if (frame <= keys[0].frame) return this._poseOf(keys[0]);
      if (frame >= keys[keys.length - 1].frame) return this._poseOf(keys[keys.length - 1]);
      for (var i = 0; i < keys.length - 1; i++) {
        var a = keys[i], b = keys[i + 1];
        if (frame >= a.frame && frame <= b.frame) {
          var span = b.frame - a.frame || 1;
          var t = (frame - a.frame) / span;
          var ease = EASINGS[a.easing] || EASINGS.linear;
          var k = a.easing === 'step' ? 0 : ease(t);
          return {
            x: a.x + (b.x - a.x) * k,
            y: a.y + (b.y - a.y) * k,
            rotation: a.rotation + (b.rotation - a.rotation) * k,
            scaleX: a.scaleX + (b.scaleX - a.scaleX) * k,
            scaleY: a.scaleY + (b.scaleY - a.scaleY) * k
          };
        }
      }
      return this._poseOf(keys[keys.length - 1]);
    },

    _poseOf: function (key) {
      return { x: key.x, y: key.y, rotation: key.rotation, scaleX: key.scaleX, scaleY: key.scaleY };
    },

    /* ---- playback ---- */
    play: function (clipName) {
      if (clipName) this.project.clipName = clipName;
      this.isPlaying = true;
    },
    pause: function () { this.isPlaying = false; },
    togglePlay: function () { this.isPlaying = !this.isPlaying; },
    stop: function () { this.isPlaying = false; this.currentFrame = 0; },
    scrub: function (normalized) {
      var n = Math.max(0, Math.min(1, normalized || 0));
      this.currentFrame = n * this.project.durationFrames;
      this.isPlaying = false;
    },
    seekFrame: function (frame) {
      this.currentFrame = Math.max(0, Math.min(this.project.durationFrames, frame));
    },

    /* ---- editing ---- */
    ensureTrack: function (boneName) {
      var found = null;
      this.project.tracks.forEach(function (t) { if (t.name === boneName) found = t; });
      if (!found) {
        found = { name: boneName, muted: false, locked: false, keys: [] };
        this.project.tracks.push(found);
      }
      return found;
    },

    /* Snapshot every bone's current pose at the current frame (== "saveAllKeys"). */
    addKeyframe: function (easing) {
      var self = this;
      var f = Math.round(this.currentFrame);
      BONES.forEach(function (b) {
        var track = self.ensureTrack(b);
        var pose = self.pose[b] || defaultPose();
        var key = {
          frame: f,
          x: pose.x, y: pose.y, rotation: pose.rotation,
          scaleX: pose.scaleX, scaleY: pose.scaleY,
          easing: easing || 'linear'
        };
        var replaced = false;
        track.keys.forEach(function (k, i) { if (k.frame === f) { track.keys[i] = key; replaced = true; } });
        if (!replaced) track.keys.push(key);
        track.keys.sort(function (a, b) { return a.frame - b.frame; });
      });
      if (f > this.project.durationFrames) this.project.durationFrames = f;
      EventBus.emit('studio:keyframe', { frame: f });
      return f;
    },

    removeKeyframesAtFrame: function (frame) {
      this.project.tracks.forEach(function (t) {
        t.keys = t.keys.filter(function (k) { return k.frame !== frame; });
      });
    },

    removeLastKeyframe: function () {
      var last = -1;
      this.project.tracks.forEach(function (t) {
        if (t.keys.length) last = Math.max(last, t.keys[t.keys.length - 1].frame);
      });
      if (last >= 0) this.removeKeyframesAtFrame(last);
      return last;
    },

    setDuration: function (frames) {
      this.project.durationFrames = Math.max(1, Math.round(frames));
    },

    keyframeCount: function () {
      var n = 0;
      this.project.tracks.forEach(function (t) { n += t.keys.length; });
      return n;
    },

    /* frame numbers that hold at least one key (for the timeline UI) */
    keyFrames: function () {
      var set = {};
      this.project.tracks.forEach(function (t) {
        t.keys.forEach(function (k) { set[k.frame] = true; });
      });
      return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
    },

    createEmptyRig: function () {
      this.project = {
        name: 'project',
        frameRate: 24,
        durationFrames: 120,
        loop: true,
        clipName: 'idle',
        characterId: null,
        tracks: [{ name: 'root', muted: false, locked: false, keys: [] }]
      };
      this.currentFrame = 0;
      this.isPlaying = false;
      if (this.pose) BONES.forEach(function (b) { AnimationStudio.pose[b] = defaultPose(); });
      EventBus.emit('studio:project', this.project);
    },

    setCharacter: function (id, name) {
      this.project.characterId = id;
      if (name) this.project.name = name + ' project';
    },

    /* ---- persistence ---- */
    serialize: function () { return JSON.stringify(this.project, null, 2); },

    exportJson: function (fileName) {
      var blob = new Blob([this.serialize()], { type: 'application/json' });
      downloadBlob(blob, (fileName || this.project.name || 'project') + '.json');
    },

    importJson: function (text) {
      var data = JSON.parse(text);
      if (!data || !data.tracks) throw new Error('not a project file');
      this.project = data;
      this.currentFrame = 0;
      EventBus.emit('studio:project', this.project);
      return data;
    }
  };

  function downloadBlob(blob, name) {
    if (C.Recorder && C.Recorder.saveBlob) { C.Recorder.saveBlob(blob, name); return; }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  C.BONES = BONES;
  C.defaultPose = defaultPose;
  C.AnimationStudio = AnimationStudio;
  C.downloadBlob = downloadBlob;
})(window);
