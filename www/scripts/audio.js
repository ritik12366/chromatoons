/* ============================================================================
 * ChromaToons.Audio — microphone capture + amplitude -> mouth (lip sync).
 * Replaces Audio/AudioController.cs and Audio/LipSyncController.cs.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  var Audio = {
    enabled: false,
    sensitivity: 60,
    smoothing: 0.6,
    amplitude: 0,
    viseme: 0,
    _ctx: null,
    _analyser: null,
    _stream: null,
    _data: null,
    _buf: null,
    _raf: 0,

    init: function () {
      if (C.AnimationStudio) C.LipSync = this;
    },

    /* Request mic and start metering. Returns a Promise. */
    start: function () {
      var self = this;
      if (this._stream) return Promise.resolve(true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return Promise.reject(new Error('Microphone not available'));
      }
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        self._stream = stream;
        var AC = global.AudioContext || global.webkitAudioContext;
        self._ctx = new AC();
        var src = self._ctx.createMediaStreamSource(stream);
        self._analyser = self._ctx.createAnalyser();
        self._analyser.fftSize = 512;
        src.connect(self._analyser);
        self._data = new Uint8Array(self._analyser.fftSize);
        self._buf = new Float32Array(self._analyser.fftSize);
        self.enabled = true;
        self._loop();
        return true;
      });
    },

    _loop: function () {
      var self = this;
      this._raf = requestAnimationFrame(function () { self._loop(); });
      if (!this._analyser) return;

      this._analyser.getFloatTimeDomainData(this._buf);
      var sum = 0;
      for (var i = 0; i < this._buf.length; i++) sum += Math.abs(this._buf[i]);
      var raw = (sum / this._buf.length) * this.sensitivity;
      this.amplitude = this.amplitude + (clamp(raw, 0, 1) - this.amplitude) * (1 - this.smoothing);

      var v = this.amplitude < 0.1 ? 0 : this.amplitude < 0.35 ? 1 : this.amplitude < 0.7 ? 2 : 3;
      this.viseme = v;

      /* Drive the mouth bone: scaleY opens the mouth (closed = ~0.25). */
      if (C.AnimationStudio && C.AnimationStudio.pose) {
        var mouth = C.AnimationStudio.pose.mouth;
        if (mouth) mouth.scaleY = 0.25 + this.amplitude * 2.2;
      }
    },

    /* Raw MediaStream (used to add mic audio to a screen recording). */
    getStream: function () { return this._stream; },

    releaseMic: function () {
      /* Keep the meter running for lipsync; only used when a recording ends. */
    },

    stop: function () {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0;
      if (this._stream) this._stream.getTracks().forEach(function (t) { t.stop(); });
      this._stream = null;
      this.enabled = false;
      this.amplitude = 0;
    },

    /* Text-driven fallback (same idea as LipSyncController.SpeakText). */
    speakText: function (text, seconds) {
      var self = this;
      seconds = seconds || 3;
      var syllables = Math.max(2, Math.round((text || '').length / 3));
      var step = (seconds * 1000) / syllables;
      var i = 0;
      var timer = setInterval(function () {
        i++;
        self.viseme = 1 + (i % 3);
        if (C.AnimationStudio && C.AnimationStudio.pose && C.AnimationStudio.pose.mouth) {
          C.AnimationStudio.pose.mouth.scaleY = 0.4 + (i % 3) * 0.5;
        }
        if (i >= syllables) {
          clearInterval(timer);
          self.viseme = 0;
          if (C.AnimationStudio && C.AnimationStudio.pose && C.AnimationStudio.pose.mouth) {
            C.AnimationStudio.pose.mouth.scaleY = 0.25;
          }
        }
      }, step);
      return timer;
    }
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  C.Audio = Audio;
})(window);
