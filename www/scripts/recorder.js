/* ============================================================================
 * ChromaToons.Recording.ScreenRecorder
 * Replaces Recording/ScreenRecorder.cs. Uses MediaRecorder (canvas.captureStream)
 * and canvas.toDataURL for stills. When the app runs inside the Android WebView
 * wrapper the ChromaNative bridge writes files into Movies/ChromaToons.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var Native = global.ChromaNative || null;

  function ts() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' +
      p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1]); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  var Recorder = {
    isRecording: false,
    quality: 'high',
    withAudio: true,
    mime: null,
    _mr: null,
    _chunks: [],
    _stream: null,
    _urls: {},
    gallery: [],

    init: function () {
      var nativeList = [];
      if (Native && Native.getSavedMedia) {
        try { nativeList = JSON.parse(Native.getSavedMedia()) || []; } catch (e) { nativeList = []; }
      }
      var local = C.Store.get('gallery', []);
      var merged = nativeList.concat(local);
      var seen = {};
      Recorder.gallery = merged.filter(function (e) {
        if (!e || !e.id || seen[e.id]) return false;
        seen[e.id] = true;
        return true;
      }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    },

    isSupported: function () {
      return !!(global.MediaRecorder && global.HTMLCanvasElement &&
        HTMLCanvasElement.prototype.captureStream);
    },

    pickMime: function () {
      if (!global.MediaRecorder) return null;
      var cands = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
      for (var i = 0; i < cands.length; i++) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(cands[i])) return cands[i];
      }
      return null;
    },

    start: function (canvas, withAudio) {
      if (this.isRecording) return { ok: false, error: 'already recording' };
      if (!this.isSupported() || !canvas || !canvas.captureStream) {
        return { ok: false, error: 'Recording is not supported on this device' };
      }
      try {
        var stream = canvas.captureStream(30);
        if (withAudio && C.Audio && C.Audio.getStream) {
          try {
            var as = C.Audio.getStream();
            as.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
          } catch (e) { /* mic denied: record video only */ }
        }
        this.mime = this.pickMime();
        var mr = new MediaRecorder(stream, this.mime ? { mimeType: this.mime } : undefined);
        this._chunks = [];
        var self = this;
        mr.ondataavailable = function (e) { if (e.data && e.data.size) self._chunks.push(e.data); };
        mr.onstop = function () { self._finish(stream); };
        mr.start(1000);
        this._mr = mr;
        this._stream = stream;
        this.isRecording = true;
        return { ok: true };
      } catch (e) {
        console.error('[Recorder] start failed', e);
        return { ok: false, error: String(e.message || e) };
      }
    },

    stop: function () {
      if (this._mr && this._mr.state !== 'inactive') this._mr.stop();
    },

    _finish: function (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      this.isRecording = false;
      if (C.Audio && C.Audio.releaseMic) C.Audio.releaseMic();
      if (!this._chunks.length) { C.EventBus.emit('recording:stopped', null); return; }
      var type = (this.mime && this.mime.indexOf('mp4') >= 0) ? 'video/mp4' : 'video/webm';
      var blob = new Blob(this._chunks, { type: type });
      this._chunks = [];
      this._storeVideo(blob);
    },

    _storeVideo: function (blob) {
      var ext = blob.type.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
      var name = 'rec_' + ts() + '.' + ext;
      var self = this;
      blobToBase64(blob).then(function (b64) {
        var path = null;
        if (Native && Native.saveVideo) {
          try { path = Native.saveVideo(b64, name); } catch (e) { path = null; }
        }
        var entry = {
          id: C.uid(), name: name, type: 'video', ts: Date.now(),
          size: blob.size, path: path || null
        };
        if (!path) self._urls[entry.id] = URL.createObjectURL(blob);
        self._add(entry);
        C.EventBus.emit('recording:stopped', entry);
      }).catch(function (e) {
        console.error('[Recorder] save failed', e);
        C.EventBus.emit('recording:stopped', null);
      });
    },

    screenshot: function (canvas) {
      var dataUrl = canvas.toDataURL('image/png');
      var name = 'shot_' + ts() + '.png';
      var path = null;
      if (Native && Native.saveImage) {
        try { path = Native.saveImage(dataUrl.split(',')[1], name); } catch (e) { path = null; }
      }
      var entry = {
        id: C.uid(), name: name, type: 'image', ts: Date.now(),
        path: path || null, thumb: this._thumb(canvas)
      };
      if (!path) this._urls[entry.id] = dataUrl;
      this._add(entry);
      return entry;
    },

    _thumb: function (canvas) {
      try {
        var w = 240;
        var h = Math.round(canvas.height / canvas.width * w) || 240;
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(canvas, 0, 0, w, h);
        return c.toDataURL('image/jpeg', 0.6);
      } catch (e) { return null; }
    },

    _add: function (entry) {
      this.gallery.unshift(entry);
      C.Store.set('gallery', this.gallery.slice(0, 60).map(function (e) {
        return { id: e.id, name: e.name, type: e.type, ts: e.ts, size: e.size, path: e.path, thumb: e.thumb };
      }));
      C.EventBus.emit('gallery:changed', this.gallery);
    },

    urlFor: function (entry) { return this._urls[entry.id] || entry.url || null; },

    open: function (entry) {
      if (entry.path && Native && Native.openFile) { Native.openFile(entry.path); return; }
      var url = this.urlFor(entry);
      if (url) global.open(url, '_blank');
    },

    remove: function (id) {
      var entry = null;
      this.gallery.forEach(function (e) { if (e.id === id) entry = e; });
      if (entry && entry.path && Native && Native.deleteFile) {
        try { Native.deleteFile(entry.path); } catch (e) { /* ignore */ }
      }
      this.gallery = this.gallery.filter(function (e) { return e.id !== id; });
      delete this._urls[id];
      C.Store.set('gallery', this.gallery.map(function (e) {
        return { id: e.id, name: e.name, type: e.type, ts: e.ts, size: e.size, path: e.path, thumb: e.thumb };
      }));
      C.EventBus.emit('gallery:changed', this.gallery);
    },

    clear: function () {
      var self = this;
      this.gallery.slice().forEach(function (e) { self.remove(e.id); });
    },

    /* Generic download for project JSON etc. */
    saveBlob: function (blob, name) {
      var self = this;
      if (Native && Native.saveImage && blob) {
        blobToBase64(blob).then(function (b64) {
          var isImage = (blob.type || '').indexOf('image') === 0;
          try {
            if (isImage) Native.saveImage(b64, name);
            else if (Native.saveDocument) Native.saveDocument(b64, name);
            self._toast('Saved ' + name);
          } catch (e) { self._fallbackDownload(blob, name); }
        });
        return;
      }
      this._fallbackDownload(blob, name);
    },

    _fallbackDownload: function (blob, name) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    },

    _toast: function (msg) { C.EventBus.emit('toast', msg); }
  };

  C.Recorder = Recorder;
})(window);
