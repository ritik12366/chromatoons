/* ============================================================================
 * ChromaToons.Creator — image import + sprite-sheet slicing helpers.
 * Replaces the character-import part of the old Creator/DragonBones flow.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  var Creator = {
    /* Read a File -> {dataUrl, width, height} */
    importImage: function (file) { return C.readImageFile(file); },

    /* Cut a horizontal sprite strip into `frames` equal cells. */
    sliceSheet: function (dataUrl, frames) {
      return new Promise(function (resolve, reject) {
        frames = Math.max(1, Math.round(frames || 1));
        var img = new Image();
        img.onerror = function () { reject(new Error('image decode failed')); };
        img.onload = function () {
          var fw = Math.floor(img.width / frames);
          var out = [];
          for (var i = 0; i < frames; i++) {
            var c = makeCanvas(fw, img.height);
            c.getContext('2d').drawImage(img, i * fw, 0, fw, img.height, 0, 0, fw, img.height);
            out.push({ index: i, dataUrl: c.toDataURL('image/png'), width: fw, height: img.height });
          }
          resolve(out);
        };
        img.src = dataUrl;
      });
    },

    /* Scale a data-URL image down so the longest side <= max. */
    downscale: function (dataUrl, max) {
      max = max || 2048;
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          if (img.width <= max && img.height <= max) { resolve(dataUrl); return; }
          var ratio = max / Math.max(img.width, img.height);
          var w = Math.round(img.width * ratio);
          var h = Math.round(img.height * ratio);
          var c = makeCanvas(w, h);
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = function () { resolve(dataUrl); };
        img.src = dataUrl;
      });
    },

    /* Build a blank transparent canvas as a starting point. */
    blankCanvas: function (w, h) {
      return makeCanvas(w || 512, h || 512).toDataURL('image/png');
    }
  };

  C.Creator = Creator;
})(window);
