/* Characters panel — replaces UI/Panels/CharactersPanel.cs */
(function (global) {
  'use strict';
  var C = global.ChromaToons;
  var h = C.UI.h;

  function render(el) {
    var store = C.CharacterStore;

    /* ---- built-in characters (offline, drawn as SVG) ---- */
    el.appendChild(C.UI.sectionTitle('Built-in Characters'));
    var libRow = h('div', { class: 'chip-row' });
    el.appendChild(libRow);
    el.appendChild(C.UI.row([
      C.UI.button('Add All Characters', 'btn--accent2', function () {
        if (!C.CharactersLib) { C.EventBus.emit('toast', 'Character library missing'); return; }
        C.CharactersLib.addAll();
        paintLib();
        refresh();
      })
    ]));
    el.appendChild(h('div', { style: { height: '14px' } }));

    function paintLib() {
      var have = {};
      store.all().forEach(function (c) { if (c.builtin) have[c.builtin] = true; });
      libRow.innerHTML = '';
      (C.CharactersLib ? C.CharactersLib.BUILTINS : []).forEach(function (b) {
        var on = !!have['builtin:' + b.id];
        libRow.appendChild(C.UI.chip((b.emoji || '') + ' ' + b.label, on, function () {
          if (on) {
            C.EventBus.emit('toast', b.label + ' already in your library');
            return;
          }
          var c = C.CharactersLib.addBuiltin(b.id);
          if (c) {
            C.EventBus.emit('toast', "Added '" + c.name + "'");
            C.EventBus.emit('characters:changed');
            paintLib();
            refresh();
          }
        }));
      });
    }

    el.appendChild(C.UI.sectionTitle('Your Characters'));
    el.appendChild(h('input', {
      class: 'input', type: 'file', accept: 'image/*',
      onchange: function (e) { importInto(null, e.target.files[0], e.target); }
    }));

    var nameInput = h('input', { class: 'input', type: 'text', placeholder: 'Enter Character Name' });
    el.appendChild(C.UI.row([
      nameInput,
      C.UI.button('Add', 'btn--accent', function () {
        var c = store.create(nameInput.value);
        C.EventBus.emit('toast', "Added '" + c.name + "'");
        nameInput.value = '';
        refresh();
      })
    ]));
    el.appendChild(h('div', { style: { height: '12px' } }));

    var list = h('div');
    el.appendChild(list);

    function refresh() {
      paintLib();
      list.innerHTML = '';
      var chars = store.all();
      if (!chars.length) { list.appendChild(C.UI.empty('No characters yet. Create one above.')); return; }
      chars.forEach(function (c) {
        var actions = [
          C.UI.button('Import', 'btn--sm', function (e) {
            var file = h('input', { type: 'file', accept: 'image/*' });
            file.onchange = function (ev) { importInto(c, ev.target.files[0], file); };
            file.click();
          }),
          C.UI.button('Open', 'btn--sm btn--accent', function () {
            C.EventBus.emit('creator:select', c.id);
            C.Panels.show('creator');
          }),
          C.UI.button('Del', 'btn--sm btn--danger', function () {
            store.remove(c.id);
            C.EventBus.emit('toast', "Deleted '" + c.name + "'");
            refresh();
          })
        ];
        list.appendChild(C.UI.listItem({
          thumb: c.sprite || null,
          title: c.name,
          meta: c.sprite ? 'image ' + (c.width || '?') + '×' + (c.height || '?') : 'no image yet',
          actions: actions
        }));
      });
    }

    function importInto(c, file, inputEl) {
      if (!file) return;
      C.Creator.importImage(file).then(function (res) {
        return C.Creator.downscale(res.dataUrl, 2048).then(function (dataUrl) {
          if (!c) c = C.CharacterStore.create(file.name.replace(/\.[^.]+$/, ''));
          C.CharacterStore.setSprite(c.id, dataUrl, res.width, res.height);
          C.EventBus.emit('characters:changed');
          C.EventBus.emit('toast', "Imported '" + c.name + "'");
          refresh();
        });
      }).catch(function (e) { C.EventBus.emit('toast', 'Import failed: ' + e.message); })
        .then(function () { try { inputEl.value = ''; } catch (e) { /* ignore */ } });
    }

    refresh();
    C.EventBus.on('characters:changed', refresh);
    C.EventBus.on('scene:changed', refresh);
  }

  C.Panels.register({
    id: 'characters',
    title: 'Characters',
    navLabel: 'Chars',
    icon: '🎭',
    render: render,
    onShow: function () { }
  });
})(window);
