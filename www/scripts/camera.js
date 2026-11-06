/* ============================================================================
 * ChromaToons.CameraRig — pan/zoom/shake for the stage.
 * Replaces CameraRig/CameraController.cs (PanZoom / Camera_IK / SecondCam).
 * Applies a CSS transform to the stage canvas so no engine is needed.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  var Camera = {
    zoom: 1,
    panX: 0,   // fraction of width
    panY: 0,   // fraction of height
    _shake: 0,
    _canvas: null,
    _raf: 0,

    attach: function (canvas) {
      this._canvas = canvas;
      if (canvas) {
        canvas.style.transformOrigin = '50% 50%';
        canvas.style.transition = 'transform 0.08s linear';
        this.apply();
      }
    },

    setZoom: function (z) { this.zoom = Math.max(1, Math.min(4, z)); this.apply(); },
    zoomBy: function (delta) { this.setZoom(this.zoom + delta); },
    setPan: function (x, y) { this.panX = x; this.panY = y; this.apply(); },
    panBy: function (dx, dy) { this.panX += dx; this.panY += dy; this.apply(); },
    reset: function () { this.zoom = 1; this.panX = 0; this.panY = 0; this._shake = 0; this.apply(); },

    shake: function (amount) {
      this._shake = Math.max(this._shake, amount || 0.5);
      if (!this._raf) this._loopShake();
    },

    _loopShake: function () {
      var self = this;
      this._raf = requestAnimationFrame(function () {
        if (self._shake <= 0.01) { self._shake = 0; self._raf = 0; self.apply(); return; }
        self.apply();
        self._shake *= 0.85;
        self._loopShake();
      });
    },

    apply: function () {
      var c = this._canvas;
      if (!c) return;
      var sx = (Math.random() - 0.5) * this._shake * 12;
      var sy = (Math.random() - 0.5) * this._shake * 12;
      var tx = this.panX * c.clientWidth + sx;
      var ty = this.panY * c.clientHeight + sy;
      c.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + this.zoom + ')';
    }
  };

  C.Camera = Camera;
})(window);
