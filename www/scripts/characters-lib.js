/* ============================================================================
 * ChromaToons.CharactersLib — built-in cartoon characters.
 *
 * Every character is drawn procedurally as an SVG data URL, so it works fully
 * offline in the APK (no image downloads, no licence issues). A character is
 * just a normal CharacterStore entry with `sprite` = SVG data URL, so all the
 * existing import / scene / rig code keeps working untouched.
 * ==========================================================================*/
(function (global) {
  'use strict';
  var C = global.ChromaToons;

  /* ---- tiny svg helpers ---- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function circle(cx, cy, r, fill, extra) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' +
      (extra ? ' ' + extra : '') + '/>';
  }

  function ellipse(cx, cy, rx, ry, fill, extra) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
  }

  function rect(x, y, w, h, fill, rx) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + (rx == null ? 0 : rx) + '" fill="' + fill + '"/>';
  }

  /* A limb as a thick rounded stroke. */
  function limb(x1, y1, x2, y2, width, color) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + color + '" stroke-width="' + width +
      '" stroke-linecap="round"/>';
  }

  /* Face block shared by the human-ish characters. */
  function face(cx, cy, r, skin, eyeColor, mouthColor) {
    return [
      circle(cx, cy, r, skin, 'stroke="#000000" stroke-opacity="0.14" stroke-width="3"'),
      circle(cx - r * 0.34, cy - r * 0.18, r * 0.135, '#ffffff'),
      circle(cx + r * 0.34, cy - r * 0.18, r * 0.135, '#ffffff'),
      circle(cx - r * 0.32, cy - r * 0.16, r * 0.075, eyeColor || '#12141c'),
      circle(cx + r * 0.36, cy - r * 0.16, r * 0.075, eyeColor || '#12141c'),
      '<path d="M' + (cx - r * 0.3) + ' ' + (cy + r * 0.3) + ' Q' + cx + ' ' +
        (cy + r * 0.62) + ' ' + (cx + r * 0.3) + ' ' + (cy + r * 0.3) +
        '" stroke="' + (mouthColor || '#12141c') + '" stroke-width="' + (r * 0.09) +
        '" fill="none" stroke-linecap="round"/>'
    ].join('');
  }

  function svg(inner, w, h) {
    var head =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
      '" viewBox="0 0 ' + w + ' ' + h + '">';
    return head + inner + '</svg>';
  }

  /* SVG -> data URL (encoded so all browsers/WebViews accept it). */
  function toDataUrl(markup) {
    var encoded;
    try {
      encoded = global.btoa(unescape(encodeURIComponent(markup)));
      return 'data:image/svg+xml;base64,' + encoded;
    } catch (e) {
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
    }
  }

  /* ---- character recipes (240x360 canvas) ---- */
  var W = 240, H = 360;

  var RECIPES = {
    boy: function () {
      var skin = '#ffd3a8', shirt = '#4cc2ff', pants = '#2b3a55';
      return svg([
        /* legs */
        limb(104, 262, 100, 336, 30, pants),
        limb(136, 262, 140, 336, 30, pants),
        ellipse(98, 342, 22, 11, '#12141c'),
        ellipse(142, 342, 22, 11, '#12141c'),
        /* body */
        rect(88, 150, 64, 120, shirt, 26),
        /* arms */
        limb(92, 168, 58, 240, 26, shirt),
        limb(148, 168, 182, 240, 26, shirt),
        circle(56, 246, 15, skin),
        circle(184, 246, 15, skin),
        /* head */
        face(120, 96, 62, skin, '#12141c', '#c0392b'),
        /* hair */
        '<path d="M58 88 Q64 26 120 26 Q176 26 182 88 Q150 58 120 62 Q90 58 58 88Z" fill="#3b2a20"/>'
      ].join(''), W, H);
    },

    girl: function () {
      var skin = '#ffd9b8', dress = '#ff6b9d', pants = '#ff6b9d';
      return svg([
        limb(106, 262, 102, 334, 26, '#ffd9b8'),
        limb(134, 262, 138, 334, 26, '#ffd9b8'),
        ellipse(100, 340, 21, 11, '#e91e63'),
        ellipse(140, 340, 21, 11, '#e91e63'),
        /* hair back */
        '<path d="M52 96 Q46 200 66 268 L174 268 Q194 200 188 96 Z" fill="#4a2c17"/>',
        rect(86, 152, 68, 116, dress, 28),
        limb(90, 170, 56, 240, 22, dress),
        limb(150, 170, 184, 240, 22, dress),
        circle(54, 246, 14, skin),
        circle(186, 246, 14, skin),
        face(120, 96, 60, skin, '#12141c', '#d81b60'),
        '<path d="M60 90 Q66 30 120 30 Q174 30 180 90 Q160 54 120 58 Q80 54 60 90Z" fill="#4a2c17"/>',
        circle(120, 30, 14, '#ffd54f')
      ].join(''), W, H);
    },

    robot: function () {
      var body = '#9aa3b2', dark = '#5c6675', glow = '#4cc2ff';
      return svg([
        rect(98, 240, 18, 96, dark, 8),
        rect(124, 240, 18, 96, dark, 8),
        rect(84, 326, 48, 20, '#3b4252', 8),
        rect(136, 326, 48, 20, '#3b4252', 8),
        rect(74, 148, 92, 104, body, 16),
        rect(92, 172, 56, 46, '#12141c', 8),
        circle(120, 195, 12, glow),
        limb(80, 168, 44, 238, 20, dark),
        limb(160, 168, 196, 238, 20, dark),
        rect(30, 232, 28, 28, glow, 6),
        rect(182, 232, 28, 28, glow, 6),
        /* head: antenna */
        '<line x1="120" y1="34" x2="120" y2="66" stroke="' + dark + '" stroke-width="8"/>',
        circle(120, 26, 13, '#e53935'),
        rect(60, 60, 120, 92, body, 22),
        rect(74, 78, 92, 42, '#12141c', 12),
        circle(98, 99, 11, glow),
        circle(142, 99, 11, glow),
        rect(92, 128, 56, 10, '#12141c', 5)
      ].join(''), W, H);
    },

    cat: function () {
      var fur = '#f5a623', dark = '#c47f14';
      return svg([
        limb(108, 268, 104, 332, 24, fur),
        limb(132, 268, 136, 332, 24, fur),
        ellipse(102, 338, 20, 10, dark),
        ellipse(138, 338, 20, 10, dark),
        '<path d="M108 320 Q88 292 62 300" stroke="' + fur + '" stroke-width="22" fill="none" stroke-linecap="round"/>',
        ellipse(120, 236, 56, 76, fur),
        ellipse(120, 246, 26, 44, '#ffe9c7'),
        limb(76, 200, 52, 258, 20, fur),
        limb(164, 200, 188, 258, 20, fur),
        /* ears */
        '<path d="M74 96 L64 40 L112 72 Z" fill="' + fur + '"/>',
        '<path d="M166 96 L176 40 L128 72 Z" fill="' + fur + '"/>',
        '<path d="M82 90 L76 56 L104 74 Z" fill="' + dark + '"/>',
        '<path d="M158 90 L164 56 L136 74 Z" fill="' + dark + '"/>',
        circle(120, 112, 62, fur),
        face(120, 112, 62, fur, '#1b5e20', '#8d3b1f'),
        '<path d="M112 124 L120 132 L128 124" stroke="#8d3b1f" stroke-width="5" fill="none"/>',
        /* whiskers */
        '<line x1="58" y1="118" x2="94" y2="124" stroke="#ffffff" stroke-opacity="0.7" stroke-width="4"/>',
        '<line x1="58" y1="136" x2="94" y2="136" stroke="#ffffff" stroke-opacity="0.7" stroke-width="4"/>',
        '<line x1="182" y1="118" x2="146" y2="124" stroke="#ffffff" stroke-opacity="0.7" stroke-width="4"/>',
        '<line x1="182" y1="136" x2="146" y2="136" stroke="#ffffff" stroke-opacity="0.7" stroke-width="4"/>'
      ].join(''), W, H);
    },

    ninja: function () {
      var suit = '#242a3a', band = '#e53935';
      return svg([
        limb(104, 258, 100, 332, 30, suit),
        limb(136, 258, 140, 332, 30, suit),
        ellipse(98, 338, 22, 11, '#111'), ellipse(142, 338, 22, 11, '#111'),
        rect(86, 150, 68, 118, suit, 24),
        limb(90, 168, 54, 240, 24, suit),
        limb(150, 168, 186, 240, 24, suit),
        circle(52, 246, 14, '#1b2130'),
        circle(188, 246, 14, '#1b2130'),
        circle(120, 96, 62, suit),
        rect(62, 84, 116, 26, band, 4),
        /* eyes */
        '<path d="M80 122 Q100 110 118 122 Q100 132 80 122Z" fill="#ffffff"/>',
        '<path d="M122 122 Q140 110 160 122 Q140 132 122 122Z" fill="#ffffff"/>',
        circle(99, 121, 6, '#12141c'), circle(141, 121, 6, '#12141c'),
        /* headband tails */
        '<path d="M180 92 L214 76 L210 96 L216 112 L180 106Z" fill="' + band + '"/>'
      ].join(''), W, H);
    },

    alien: function () {
      var body = '#7ed957', dark = '#4e9c34';
      return svg([
        limb(106, 266, 102, 330, 20, body),
        limb(134, 266, 138, 330, 20, body),
        ellipse(100, 338, 20, 10, dark), ellipse(140, 338, 20, 10, dark),
        ellipse(120, 218, 52, 74, body),
        limb(74, 196, 48, 254, 16, body),
        limb(166, 196, 192, 254, 16, body),
        circle(46, 260, 12, body), circle(194, 260, 12, body),
        /* head + eyes */
        ellipse(120, 108, 60, 78, body),
        ellipse(96, 100, 24, 30, '#12141c'),
        ellipse(144, 100, 24, 30, '#12141c'),
        circle(92, 94, 8, '#ffffff'), circle(140, 94, 8, '#ffffff'),
        '<path d="M104 150 Q120 162 136 150" stroke="' + dark + '" stroke-width="7" fill="none" stroke-linecap="round"/>',
        /* antennae */
        '<line x1="96" y1="40" x2="86" y2="12" stroke="' + dark + '" stroke-width="7"/>',
        '<line x1="146" y1="40" x2="158" y2="12" stroke="' + dark + '" stroke-width="7"/>',
        circle(85, 8, 10, '#ffd54f'), circle(160, 8, 10, '#ffd54f')
      ].join(''), W, H);
    },

    ghost: function () {
      var body = '#e8ecf5';
      return svg([
        '<path d="M60 300 Q60 90 120 60 Q180 90 180 300 Q168 286 156 302 Q144 286 132 302 ' +
          'Q120 286 108 302 Q96 286 84 302 Q72 286 60 300Z" fill="' + body + '" opacity="0.95"/>',
        circle(98, 130, 16, '#12141c'), circle(142, 130, 16, '#12141c'),
        circle(93, 125, 5, '#ffffff'), circle(137, 125, 5, '#ffffff'),
        ellipse(120, 178, 18, 22, '#12141c'),
        '<path d="M180 210 Q214 196 210 160 Q206 130 190 138" stroke="' + body +
          '" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.9"/>'
      ].join(''), W, H);
    }
  };

  /* ---- public list (id, label, emoji) ---- */
  var BUILTINS = [
    { id: 'boy', label: 'Toon Boy', emoji: '👦' },
    { id: 'girl', label: 'Toon Girl', emoji: '👧' },
    { id: 'robot', label: 'Robot', emoji: '🤖' },
    { id: 'cat', label: 'Tom Cat', emoji: '🐱' },
    { id: 'ninja', label: 'Ninja', emoji: '🥷' },
    { id: 'alien', label: 'Alien', emoji: '👽' },
    { id: 'ghost', label: 'Ghost', emoji: '👻' }
  ];

  function spriteFor(id) {
    var recipe = RECIPES[id];
    if (!recipe) return null;
    return toDataUrl(recipe());
  }

  /* Add a built-in character to the store (idempotent per kind+name). */
  function addBuiltin(id) {
    var meta = null;
    BUILTINS.forEach(function (b) { if (b.id === id) meta = b; });
    if (!meta) return null;

    var mark = 'builtin:' + id;
    var existing = null;
    C.CharacterStore.all().forEach(function (c) { if (c.builtin === mark) existing = c; });
    if (existing) return existing;

    var c = C.CharacterStore.create(meta.label);
    c.builtin = mark;
    var dataUrl = spriteFor(id);
    c.sprite = dataUrl;
    c.width = W;
    c.height = H;
    C.CharacterStore.update(c);
    return c;
  }

  /* Add every built-in character that is not in the library yet. */
  function addAll() {
    var added = 0;
    BUILTINS.forEach(function (b) {
      var mark = 'builtin:' + b.id;
      var exists = false;
      C.CharacterStore.all().forEach(function (c) { if (c.builtin === mark) exists = true; });
      if (!exists) { addBuiltin(b.id); added++; }
    });
    C.EventBus.emit('characters:changed');
    C.EventBus.emit('toast', added ? ('Added ' + added + ' character(s)') : 'All characters already added');
    return added;
  }

  C.CharactersLib = {
    BUILTINS: BUILTINS,
    widths: { W: W, H: H },
    spriteFor: spriteFor,
    addBuiltin: addBuiltin,
    addAll: addAll
  };
})(window);